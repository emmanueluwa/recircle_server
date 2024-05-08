import { RequestHandler } from "express";
import UserModel from "./../models/user";

export const createNewUser: RequestHandler = async (req, res) => {
  //read incoming data
  const { email, password, name } = req.body;

  //if data is not valid send error
  if (!name) return res.status(422).json({ message: "Name is missing" });
  if (!email) return res.status(422).json({ message: "Email is missing" });
  if (!password)
    return res.status(422).json({ message: "Password is missing" });

  //check if user already exists
  const exisitingUser = await UserModel.findOne({ email });
  if (exisitingUser)
    return res
      .status(401)
      .json({ message: "Unauthorised request, email already in use!" });

  await UserModel.create({ name, email, password });

  res.send("marathon");
};
