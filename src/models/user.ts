import mongoose, { Schema } from "mongoose";
import { type ISignupSchema } from "../utils/auth.validator.ts";

// 1. Declare method signatures
// export interface IUserMethods {
//   validatePassword(candidatePassword: string): Promise<boolean>;
//   getJWT(): string;
// }

// 2. Define Model type
// export type UserModel = Model<ISignupSchema, {}, IUserMethods>;

const userSchema = new Schema<ISignupSchema>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    profilePicture: { type: String },
    about: { type: String, default: "" },
    skills: { type: [String], default: [] },
    projects: { type: [String], default: [] },
    experience: { type: [String], default: [] },
    education: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: Record<string, unknown>) {
        const { password, __v, ...safeUser } = ret;
        return safeUser;
      },
    },
  },
);

// Instance method for password check
// userSchema.methods.validatePassword = async function (
//   candidatePassword: string,
// ) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// Instance method for JWT generation
// userSchema.methods.getJWT = function () {
//   return jwt.sign({ userId: this._id }, process.env.JWT_SECRET || "secret", {
//     expiresIn: "7d",
//   });
// };

const User = mongoose.model<ISignupSchema>("User", userSchema);
export default User;
