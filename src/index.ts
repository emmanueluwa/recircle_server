import "dotenv/config";
import "express-async-errors";
import "./db";
import express, { RequestHandler } from "express";
import http from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import authRouter from "./routes/auth";
import path from "path";
import formidable from "formidable";
import productRouter from "./routes/product";
import { sendErrorResponse } from "./utils/helper";
import { TokenExpiredError, verify } from "jsonwebtoken";
import conversationRouter from "./routes/conversation";

const app = express();

const server = http.createServer(app);
//path for frontend to send messages to
const io = new Server(server, {
  path: "/socket-message",
});

app.use(morgan("dev"));

app.use(express.static("src/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use("/auth", authRouter);
app.use("/product", productRouter);
app.use("/conversation", conversationRouter);

//socket io
io.use((socket, next) => {
  const socketReq = socket.handshake.auth as { token: string } | undefined;
  if (!socketReq?.token) {
    return next(new Error("Unauthorised request!"));
  }

  try {
    socket.data.jwtDecode = verify(socketReq.token, process.env.JWT_SECRET!);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return next(new Error("jwt expired"));
    }

    return next(new Error("invalid token!"));
  }

  next();
});
io.on("connection", (socket) => {
  console.log(socket.data);

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
