import { SignupSchema } from "./auth.validator.ts";
import { z } from "zod";

export const UpdateProfileSchema = SignupSchema.omit({
  email: true,
  password: true,
})
  .partial() // Automatically makes every field optional for PATCH!
  .strict(); //Rejects the request if the client passes unknown/unrecognized keys in req.body

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: SignupSchema.shape.password, // Reuses full strength validation (regex, length, etc.)
});

export const DeleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required!"),
});
