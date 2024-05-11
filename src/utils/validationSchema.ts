import { isValidObjectId } from "mongoose";
import * as yup from "yup";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

yup.addMethod(yup.string, "email", function validateEmail(message) {
  return this.matches(emailRegex, {
    message,
    name: "email",
    excludeEmptyString: true,
  });
});

export const newUserSchema = yup.object({
  name: yup.string().required("Name is missing"),
  email: yup.string().email("Invalid email").required("Email is missing"),
  password: yup
    .string()
    .required("Password is missing")
    .min(8, "Password needs to be 8 a more characters")
    .matches(passwordRegex, "Password is not safe enough"),
});

export const verifyTokenSchema = yup.object({
  id: yup.string().test({
    name: "valid-id",
    mesage: "Invalid user id",
    test: (value) => isValidObjectId(value),
  }),
  token: yup.string().required("token is missing"),
});
