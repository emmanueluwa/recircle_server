import { Router } from "express";
import {
  createNewUser,
  generateForgotLink,
  generateVerificationLink,
  grantAccesToken,
  sendProfile,
  signIn,
  signOut,
  verifyEmail,
} from "./../controllers/auth";
import validate from "./../middleware/validate";
import { newUserSchema, verifyTokenSchema } from "./../utils/validationSchema";
import { isAuth } from "src/middleware/auth";

const authRouter = Router();

authRouter.post("/sign-up", validate(newUserSchema), createNewUser);
authRouter.post("/verify", validate(verifyTokenSchema), verifyEmail);
authRouter.get("/verify-token", isAuth, generateVerificationLink);
authRouter.post("/sign-in", signIn);
authRouter.get("/profile", isAuth, sendProfile);
//user only comes to this endpoint if token invalid so auth middleware not needed
authRouter.post("/refresh-token", grantAccesToken);
authRouter.post("/sign-out", isAuth, signOut);
authRouter.post("/forgot-pass", generateForgotLink);

export default authRouter;
