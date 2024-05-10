import { Router } from "express";
import { createNewUser, verifyEmail } from "./../controllers/auth";
import validate from "./../middleware/validate";
import { newUserSchema } from "./../utils/validationSchema";

const authRouter = Router();

authRouter.post("/sign-up", validate(newUserSchema), createNewUser);
authRouter.post("/verify", verifyEmail);

export default authRouter;
