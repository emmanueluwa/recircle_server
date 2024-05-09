import { Schema, model } from "mongoose";
import { hash, compare, genSalt } from "bcrypt";

const userSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
    },
    name: { type: String, required: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

//fire this function before saving user
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await genSalt(10);
    this.password = await hash(this.password, salt);
  }

  next();
});

userSchema.methods.comparePassword = async function (password: string) {
  return await compare(password, this.password);
};

const UserModel = model("User", userSchema);
export default UserModel;
