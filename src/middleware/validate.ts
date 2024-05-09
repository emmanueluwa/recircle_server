import { RequestHandler } from "express";
import { sendErrorResponse } from "src/utils/helper";
import * as yup from "yup";

//validating schema
const validate = (schema: yup.Schema): RequestHandler => {
  return async (req, res, next) => {
    try {
      await schema.validate(
        { ...req.body },
        { strict: true, abortEarly: true }
      );
      next();
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        sendErrorResponse(res, error.message, 422);
      } else {
        next(error);
      }
    }
  };
};

export default validate;
