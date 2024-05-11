import { RequestHandler } from "express";
import { sendErrorResponse } from "src/utils/helper";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import UserModel from "src/models/user";

export const isAuth: RequestHandler = async (req, res, next) => {
  try {
    // read auth header and validate
    const authToken = req.headers.authorization;
    if (!authToken) return sendErrorResponse(res, "unauthorised request!", 403);

    // remove "Bearer" from infront of token
    const token = authToken.split("Bearer ")[1];
    const payload = jwt.verify(token, "secret") as { id: string };

    // check if there is a user with this id
    const user = await UserModel.findById(payload.id);
    if (!user) return sendErrorResponse(res, "unauthorised request!", 403);

    //attach user to request object
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      verfied: user.verified,
    };

    next();
  } catch (error) {
    //check if token is already expired
    if (error instanceof TokenExpiredError) {
      return sendErrorResponse(res, "Session expired", 401);
    }

    if (error instanceof JsonWebTokenError) {
      return sendErrorResponse(res, "unauthorised access", 401);
    }

    next(error);
  }
};
