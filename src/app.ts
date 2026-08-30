import express, { type Express, type Request, type Response } from "express";
import connectDB from "./config/database.ts";
import User from "./models/user.ts";
import {
  SignupSchema,
  UpdateProfileSchema,
  LoginSchema,
} from "./utils/validator.ts";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import userAuth from "./middlewares/auth.ts";
import { StatusCodes } from "http-status-codes";

const app: Express = express();

app.use(express.json());

app.use(cookieParser());

app.post("/signup", async (req: Request, res: Response) => {
  try {
    const validatedData = SignupSchema.parse(req.body);

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const user = new User({
      ...validatedData,
      password: hashedPassword,
    });
    const newUser = await user.save();
    return res
      .status(StatusCodes.CREATED)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: error.issues }); // Clean field-by-field validation error messages!
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
});

app.post("/login", async (req: Request, res: Response) => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid credentials" });
    }
    const isPasswordValid = await user.validatePassword(validatedData.password);
    if (!isPasswordValid) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid credentials" });
    }
    // Create JWT Token
    const token = user.getJWT();

    // Put the token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
    return res
      .status(StatusCodes.OK)
      .json({ message: "Login successful", user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: error.issues }); // Clean field-by-field validation error messages!
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
});

app.get("/user", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    }
    return res.status(StatusCodes.OK).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
});

app.get("/profile", userAuth, async (req: Request, res: Response) => {
  try {
    // get the user from the cookie
    const user = req.user;
    return res.status(StatusCodes.OK).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
});

app.get("/feed", async (req: Request, res: Response) => {
  try {
    const users = await User.find({});
    return res.status(StatusCodes.OK).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
});

app.patch("/user", async (req: Request, res: Response) => {
  try {
    // Zod validates everything, drops unknown/hacker keys, and type-checks!
    const validatedData = UpdateProfileSchema.parse(req.body);

    const user = await User.findByIdAndUpdate(req.body.userId, validatedData, {
      returnDocument: "after",
    });

    return res.status(StatusCodes.OK).json({ data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: error.issues }); // Clean field-by-field validation error messages!
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
});

app.delete("/user", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    }
    return res
      .status(StatusCodes.OK)
      .json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
});

connectDB()
  .then(() => {
    app.listen(3000, () => console.log("Server listening on port 3000"));
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1); // Stop server if DB fails to connect
    // code 0 is for success and code 1 is for failure
  });
