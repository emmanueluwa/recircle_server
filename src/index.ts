import "dotenv/config";
import "express-async-errors";
import "./db";
import express, { RequestHandler } from "express";
import http from "http";
import { Server } from "socket.io";
import authRouter from "./routes/auth";
import path from "path";
import formidable from "formidable";
import productRouter from "./routes/product";
import { sendErrorResponse } from "./utils/helper";

const app = express();

const server = http.createServer(app);
//path for frontend to send messages to
const io = new Server(server, {
  path: "/socket-message",
});

app.use(express.static("src/public"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use("/auth", authRouter);
app.use("/product", productRouter);

//socket io
io.on("connection", (socket) => {
  console.log("user is connected!");
});

app.post("/upload-file", async (req, res) => {
  const form = formidable({
    uploadDir: path.join(__dirname, "public"),
    filename(name, ext, part, form) {
      return Date.now() + "_" + part.originalFilename;
    },
  });
  await form.parse(req);
  res.send("ok");
});

app.use(function (err, req, res, next) {
  res.status(500).json({ message: err.message });
} as express.ErrorRequestHandler);

app.use("*", (req, res) => {
  sendErrorResponse(res, "Not Found!", 404);
});

server.listen(8000, () => {
  console.log("app running on localhost port 8000");
});
