import { RequestHandler } from "express";
import UserModel from "./../models/user";
import crypto from "crypto";
import nodemailer from "nodemailer";
import AuthVerificationTokenModel from "src/models/authVerificationToken";
import { sendErrorResponse } from "src/utils/helper";

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
  const link = `http://localhost:8000/verify?id=${user._id}&token=${token}`;

  const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "66dacff4db2f1d",
      pass: "7f38f75febf599",
    },
  });

  await transport.sendMail({
    to: user.email,
    from: "verification@recircle.com",
    html: `<h1>Click the link to verify your account: <a href="${link}">link</a></h1>`,
  });

  res.json({ message: "Please check your inbox" });
};
