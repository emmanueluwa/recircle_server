import "./db";
import express, { RequestHandler } from "express";
import authRouter from "./routes/auth";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use("/auth", authRouter);

app.listen(8000, () => {
  console.log("app running on localhost port 8000");
});
