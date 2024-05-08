import { connect } from "mongoose";

// const uri = "mongodb://localhost:27017/recircle";
const uri = "mongodb://127.0.0.1:27017/recircle";

connect(uri)
  .then(() => {
    console.log("db connected successfully");
  })
  .catch((err) => {
    console.log("db connection error: ", err.message);
  });
