import { Response } from "express";

export const sendErrorResponse = (
  res: Response,
  message: string,
  statusCode: number
) => {
  return res.status(statusCode).json({ message: `${message} is missing!` });
};
