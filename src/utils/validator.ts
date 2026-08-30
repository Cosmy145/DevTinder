// import { type Request, type Response } from "express";

// export const SignUpSchema = (req: Request, res: Response) => {
//   const { firstName, lastName, email, password, age, gender, ...rest } =
//     req.body;
//   if (!firstName || !lastName || !email || !password || !age || !gender) {
//     return res.status(400).json({ message: "All fields are required" });
//   }
//   if (age < 18) {
//     return res.status(400).json({ message: "Age must be at least 18" });
//   }
//   if (age > 100) {
//     return res.status(400).json({ message: "Age must be at most 100" });
//   }
//   if (gender !== "Male" && gender !== "Female") {
//     return res.status(400).json({ message: "Gender must be Male or Female" });
//   }
// };

// export const UpdateProfileSchema = (req: Request, res: Response) => {
//   const { userId, ...updates } = req.body;
//   if (!userId) {
//     return res.status(400).json({ message: "userId is required" });
//   }
//   const ALLOWED_UPDATES = [
//     "firstName",
//     "lastName",
//     "password",
//     "age",
//     "gender",
//     "profilePicture",
//     "about",
//     "skills",
//     "projects",
//     "experience",
//     "education",
//   ];

//   const isValidUpdate = Object.keys(updates).every((key) =>
//     ALLOWED_UPDATES.includes(key),
//   );

//   if (!isValidUpdate) {
//     return res.status(400).json({ message: "Invalid updates" });
//   }
// }

import { z } from "zod";

// Define once:
export const SignupSchema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  email: z.email().toLowerCase().trim(),
  password: z
    .string()
    .min(8)
    .max(64, "Password cannot exceed 64 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character (@, $, !, %, *, ?, &, etc.)",
    ),
  age: z.number().min(18).max(100),
  gender: z.enum(["Male", "Female"]),
  profilePicture: z.url().optional(),
  about: z.string().max(500).optional(),
  skills: z.array(z.string()).max(10).optional(),
  projects: z.array(z.string()).max(10).optional(),
  experience: z.array(z.string()).max(10).optional(),
  education: z.array(z.string()).max(50).optional(),
});

export const LoginSchema = z.object({
  email: z.email().toLowerCase().trim(),
  password: z.string().min(1, "Password is required!"),
});

export const UpdateProfileSchema = SignupSchema.omit({
  email: true,
  password: true,
})
  .partial()
  .strict(); // Automatically makes every field optional for PATCH!

export type ISignupSchema = z.infer<typeof SignupSchema>;
