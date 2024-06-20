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
import ConversationModel from "./models/conversation";
import { updateSeenStatus } from "./controllers/conversation";

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

type MessageProfile = {
  id: string;
  name: string;
  avatar?: string;
};

type IncomingMessage = {
  message: {
    id: string;
    time: string;
    text: string;
    user: MessageProfile;
  };
  to: string;
  conversationId: string;
};

type OutgoingMessageResponse = {
  message: {
    id: string;
    time: string;
    text: string;
    user: MessageProfile;
    viewed: boolean;
  };
  from: MessageProfile;
  conversationId: string;
};

type SeenData = {
  messageId: string;
  peerId: string;
  conversationId: string;
};

io.on("connection", (socket) => {
  const socketData = socket.data as { jwtDecode: { id: string } };

  const userId = socketData.jwtDecode.id;
  socket.join(userId);

  socket.on("chat:new", async (data: IncomingMessage) => {
    const { conversationId, to, message } = data;

    await ConversationModel.findByIdAndUpdate(conversationId, {
      $push: {
        chats: {
          sentBy: message.user.id,
          content: message.text,
          timestamp: message.time,
        },
      },
    });

    const messageResponse: OutgoingMessageResponse = {
      from: message.user,
      conversationId,
      message: { ...message, viewed: false },
    };

    socket.to(to).emit("chat:message", messageResponse);
  });

  socket.on("chat:typing", (typingData: { to: string; active: boolean }) => {
    socket.to(typingData.to).emit("chat:typing", { typing: typingData.active });
  });

  socket.on(
    "chat:seen",
    async ({ conversationId, messageId, peerId }: SeenData) => {
      await updateSeenStatus(peerId, conversationId);
      socket.to(peerId).emit("chat:seen", { conversationId, messageId });
    }
  );
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
