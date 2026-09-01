import Express, { Router, type Request, type Response } from "express";
import { SignupSchema, LoginSchema } from "../utils/validator.ts";
import * as AuthService from "../services/auth.service.ts";
import User from "../models/user.ts";
import { StatusCodes } from "http-status-codes";
import z from "zod";

const router: Router = Express.Router();

router.post("/signup", async (req: Request, res: Response) => {
  try {
    const validatedData = SignupSchema.parse(req.body);

    // 1. Fast fail check (avoids expensive bcrypt CPU hashing)
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ message: "User with this email already exists" });
    }

    // 2. Hash password & persist
    const hashedPassword = await AuthService.hashPassword(
      validatedData.password,
    );
    const user = new User({
      ...validatedData,
      password: hashedPassword,
    });

    const newUser = await user.save();

    return res
      .status(StatusCodes.CREATED)
      .json({ message: "User created successfully", user: newUser });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: error.issues });
    }

    // 3. Catch race condition duplicate key errors from DB (Error code 11000)
    if (error?.code === 11000) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ message: "User with this email already exists" });
    }

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    // 1. validate the data
    const validatedData = LoginSchema.parse(req.body);
    // 2. find the user (explicitly include password since select: false is on schema)
    const user = await User.findOne({ email: validatedData.email }).select(
      "+password",
    );
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid Credentails" });
    }
    // 3. compare the password
    const isPasswordValid = await AuthService.comparePassword(
      validatedData.password,
      user.password,
    );
    if (!isPasswordValid) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid Credentials" });
    }
    // 4. create a JWT
    const token = AuthService.generateToken(user._id);
    // 5. put the jwt in a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
    return res
      .status(StatusCodes.OK)
      .json({ message: "Login Successful", user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: error.issues });
    } // Clean field-by-field validation error messages!
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal Server Error." });
  }
});

router.post("/logout", async (req: Request, res: Response) => {
  // 1. clear the cookie
  res.clearCookie("token");
  return res.status(StatusCodes.OK).json({ message: "Logout Successful" });
});

export default router;
