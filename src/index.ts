import "dotenv/config";
import "express-async-errors";
import "./db";
import express, { RequestHandler } from "express";
import authRouter from "./routes/auth";

const app = express();

app.use(express.static("src/public"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use("/auth", authRouter);

app.use(function (err, req, res, next) {
  res.status(500).json({ message: err.message });
} as express.ErrorRequestHandler);

app.listen(8000, () => {
  console.log("app running on localhost port 8000");
});
