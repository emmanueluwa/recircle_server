import { isValidObjectId } from "mongoose";
import * as yup from "yup";
import categories from "./categories";

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

const tokenAndId = {
  id: yup.string().test({
    name: "valid-id",
    mesage: "Invalid user id",
    test: (value) => isValidObjectId(value),
  }),
  token: yup.string().required("token is missing"),
};

const password = {
  password: yup
    .string()
    .required("Password is missing")
    .min(8, "Password needs to be 8 a more characters")
    .matches(passwordRegex, "Password is not safe enough"),
};

export const newUserSchema = yup.object({
  name: yup.string().required("Name is missing"),
  email: yup.string().email("Invalid email").required("Email is missing"),
  ...password,
});

export const verifyTokenSchema = yup.object({
  ...tokenAndId,
});

export const resetPasswordSchema = yup.object({
  ...tokenAndId,
  ...password,
});

export const newProductSchema = yup.object({
  name: yup.string().required("Name is missing!"),
  description: yup.string().required("Description is missing!"),
  category: yup
    .string()
    .oneOf(categories, "Invalid category!")
    .required("Category is missing!"),
  price: yup
    .string()
    .transform((value) => {
      // check if numeric value
      if (isNaN(+value)) return "";

      return +value;
    })
    .required("Price is missing!"),
  // purchasingDate: yup.date().required("Purchasing date is missing!"),
});
