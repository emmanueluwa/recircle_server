import { Router } from "express";
import {
  createNewUser,
  generateForgotLink,
  generateVerificationLink,
  grantAccesToken,
  grantValid,
  isValidPasswordResetToken,
  sendProfile,
  signIn,
  signOut,
  updateAvater,
  updatePassword,
  updateProfile,
  verifyEmail,
} from "./../controllers/auth";
import validate from "./../middleware/validate";
import {
  newUserSchema,
  resetPasswordSchema,
  verifyTokenSchema,
} from "./../utils/validationSchema";
import { isAuth } from "src/middleware/auth";
import fileParser from "src/middleware/fileParser";

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
authRouter.post(
  "/verify-pass-reset-token",
  validate(verifyTokenSchema),
  isValidPasswordResetToken,
  grantValid
);
authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  isValidPasswordResetToken,
  updatePassword
);

authRouter.patch("/update-profile", isAuth, updateProfile);
authRouter.patch("/update-avatar", isAuth, fileParser, updateAvater);

export default authRouter;
