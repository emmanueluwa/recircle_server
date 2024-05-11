import { Router } from "express";
import {
  createNewUser,
  sendProfile,
  signIn,
  verifyEmail,
} from "./../controllers/auth";
import validate from "./../middleware/validate";
import { newUserSchema, verifyTokenSchema } from "./../utils/validationSchema";
import { isAuth } from "src/middleware/auth";

const authRouter = Router();

authRouter.post("/sign-up", validate(newUserSchema), createNewUser);
authRouter.post("/verify", validate(verifyTokenSchema), verifyEmail);
authRouter.post("/sign-in", signIn);
authRouter.get("/profile", isAuth, sendProfile);

export default authRouter;
