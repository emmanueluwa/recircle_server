import { RequestHandler } from "express";
import UserModel from "./../models/user";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import AuthVerificationTokenModel from "src/models/authVerificationToken";
import { sendErrorResponse } from "src/utils/helper";
import mail from "src/utils/mail";
import PassResetTokenModel from "src/models/passwordResetToken";

const VERIFICATION_LINK = process.env.VERIFICATION_LINK;
const JWT_SECRET = process.env.JWT_SECRET!;
const PASSWORD_RESET_LINK = process.env.PASSWORD_RESET_LINK;

export const createNewUser: RequestHandler = async (req, res) => {
  //read incoming data
  const { email, password, name } = req.body;

  //if data is not valid send error
  // if (!name) return sendErrorResponse(res, "Name is missing!", 422);
  // if (!email) return sendErrorResponse(res, "Email is missing!", 422);
  // if (!password) return sendErrorResponse(res, "Password is missing!", 422);

  //if user does not exist create a new one
  const exisitingUser = await UserModel.findOne({ email });
  if (exisitingUser)
    return sendErrorResponse(
      res,
      "Unauthorised request, email already in use!",
      401
    );

  const user = await UserModel.create({ name, email, password });

  //generate then store stoke verification token
  const token = crypto.randomBytes(36).toString("hex");
  await AuthVerificationTokenModel.create({ owner: user._id, token });

  //send verification link with token to email
  const link = `${VERIFICATION_LINK}?id=${user._id}&token=${token}`;

  await mail.sendVerification(user.email, link);

  res.json({ message: "Please check your inbox" });
};

export const verifyEmail: RequestHandler = async (req, res) => {
  //read the incoming id and token data
  const { id, token } = req.body;

  //find token in db send error if none
  const authToken = await AuthVerificationTokenModel.findOne({ owner: id });
  if (!authToken) return sendErrorResponse(res, "unauthorised request!", 403);

  //if token is valid update user
  const isMatched = await authToken.compareToken(token);
  console.log(isMatched);
  if (!isMatched)
    return sendErrorResponse(
      res,
      "unauthorised request, token not valid!",
      403
    );

  //changed verified property to true for user
  await UserModel.findByIdAndUpdate(id, { verified: true });

  //single use only
  await AuthVerificationTokenModel.findByIdAndDelete(authToken._id);

  res.json({
    message: "Thanks for joining the community! Your email is now verified",
  });
};

export const generateVerificationLink: RequestHandler = async (req, res) => {
  //read the incoming id
  const { id } = req.user;
  const token = crypto.randomBytes(36).toString("hex");

  const link = `${VERIFICATION_LINK}?id=${id}&token=${token}`;

  await AuthVerificationTokenModel.findOneAndDelete({ owner: id });

  await AuthVerificationTokenModel.create({ owner: id, token });

  await mail.sendVerification(req.user.email, link);

  res.json({ message: "Please check your email inbox" });
};

export const signIn: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  //find user
  const user = await UserModel.findOne({ email });
  if (!user) return sendErrorResponse(res, "Email/Password missmatch", 403);

  //check password
  const isMatched = await user.comparePassword(password);
  if (!isMatched)
    return sendErrorResponse(res, "Email/Password missmatch", 403);

  const payload = { id: user._id };

  //generate tokens
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(payload, JWT_SECRET);

  if (!user.tokens) user.tokens = [refreshToken];
  else user.tokens.push(refreshToken);

  await user.save();

  //send both tokens to user
  res.json({
    profile: {
      id: user._id,
      email: user.email,
      name: user.name,
      verified: user.verified,
    },
    tokens: { refresh: refreshToken, acces: accessToken },
  });
};

export const sendProfile: RequestHandler = async (req, res) => {
  //get user from request object that came from successful signin
  res.json({
    profile: req.user,
  });
};

export const grantAccesToken: RequestHandler = async (req, res) => {
  //read and verify refresh token
  const { refreshToken } = req.body;
  if (!refreshToken)
    return sendErrorResponse(res, "Unauthorised request!", 403);

  const payload = jwt.verify(refreshToken, JWT_SECRET) as { id: string };

  if (!payload.id) return sendErrorResponse(res, "Unauthorised request!", 401);

  const user = await UserModel.findOne({
    _id: payload.id,
    tokens: refreshToken,
  });

  if (!user) {
    //user refresh token is compromised, remove all previous tokens
    await UserModel.findByIdAndUpdate(payload.id, { tokens: [] });
    return sendErrorResponse(res, "Unauthorised request", 401);
  }

  //generate tokens
  const newAccessToken = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: "15m",
  });
  const newRefreshToken = jwt.sign({ id: user._id }, JWT_SECRET);

  //filter through tokens
  user.tokens = user.tokens.filter((t) => t !== refreshToken);
  user.tokens.push(newRefreshToken);
  await user.save();

  res.json({
    tokens: { refresh: newRefreshToken, access: newAccessToken },
  });
};

export const signOut: RequestHandler = async (req, res) => {
  const { refreshToken } = req.body;

  //remove the refresh token
  const user = await UserModel.findOne({
    _id: req.user.id,
    tokens: refreshToken,
  });
  if (!user)
    return sendErrorResponse(res, "Unauthorised request, user not found!", 403);

  const newTokens = user.tokens.filter((t) => t !== refreshToken);
  user.tokens = newTokens;
  await user.save();

  res.send();
};

export const generateForgotLink: RequestHandler = async (req, res) => {
  //ask user for email
  const { email } = req.body;

  //find user, if none send error
  const user = await UserModel.findOne({ email });
  if (!user)
    return sendErrorResponse(
      res,
      "Email does not exist within community!",
      404
    );

  // generate password link, first remove any current token
  await PassResetTokenModel.findOneAndDelete({ owner: user._id });

  //generate token
  const token = crypto.randomBytes(36).toString("hex");
  await PassResetTokenModel.create({ owner: user._id, token });

  //generate and send reset link with token to email
  const passwordResetLink = `${PASSWORD_RESET_LINK}?id=${user._id}&token=${token}`;

  await mail.sendPasswordResetLink(user.email, passwordResetLink);

  res.json({ message: "Please check your email inbox" });
};

export const isValidPasswordResetToken: RequestHandler = async (
  req,
  res,
  next
) => {
  //read token and id
  const { id, token } = req.body;

  // check db for token, throw errror if notvalid
  const resetPassToken = await PassResetTokenModel.findOne({ owner: id });
  if (!resetPassToken)
    return sendErrorResponse(res, "Unauthorised request, invalid token!", 403);

  //compare token to token in db
  const matched = await resetPassToken.compareToken(token);
  if (!matched)
    return sendErrorResponse(res, "Unauthorised request, invalid token!", 403);

  next();
};

export const grantValid: RequestHandler = async (req, res) => {
  res.json({ valid: true });
};
