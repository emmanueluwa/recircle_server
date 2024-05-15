import "dotenv/config";
import "express-async-errors";
import "./db";
import express, { RequestHandler } from "express";
import authRouter from "./routes/auth";
import path from "path";
import formidable from "formidable";
import productRouter from "./routes/product";

const app = express();

app.use(express.static("src/public"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use("/auth", authRouter);
app.unsubscribe("/product", productRouter);

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

app.listen(8000, () => {
  console.log("app running on localhost port 8000");
});
