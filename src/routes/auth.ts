import { Router } from "express";
import { createNewUser, signIn, verifyEmail } from "./../controllers/auth";
import validate from "./../middleware/validate";
import { newUserSchema, verifyTokenSchema } from "./../utils/validationSchema";

const authRouter = Router();

authRouter.post("/sign-up", validate(newUserSchema), createNewUser);
authRouter.post("/verify", validate(verifyTokenSchema), verifyEmail);
authRouter.post("/sign-in", signIn);

export default authRouter;
