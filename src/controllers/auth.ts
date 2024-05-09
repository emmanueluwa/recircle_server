import { RequestHandler } from "express";
import UserModel from "./../models/user";
import crypto from "crypto";
import AuthVerificationTokenModel from "src/models/authVerificationToken";

export const createNewUser: RequestHandler = async (req, res) => {
  //read incoming data
  const { email, password, name } = req.body;

  //if data is not valid send error
  if (!name) return res.status(422).json({ message: "Name is missing" });
  if (!email) return res.status(422).json({ message: "Email is missing" });
  if (!password)
    return res.status(422).json({ message: "Password is missing" });

  //if user does not exist create a new one
  const exisitingUser = await UserModel.findOne({ email });
  if (exisitingUser)
    return res
      .status(401)
      .json({ message: "Unauthorised request, email already in use!" });

  const user = await UserModel.create({ name, email, password });

  //generate then store stoke verification token
  const token = crypto.randomBytes(36).toString("hex");
  await AuthVerificationTokenModel.create({ owner: user._id, token });

  //send verification link with token to email
  const link = `http://localhost:8000/verify?id=${user._id}&token=${token}`;

  res.send(link);
};
