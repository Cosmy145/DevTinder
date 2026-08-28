import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age: number;
  gender: "Male" | "Female";
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true, enum: ["male", "female"] },
  },
  { timestamps: true },
);

// Pass generic to model<IUser>
const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
