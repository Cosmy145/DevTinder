import { Router, type Request, type Response } from "express";
import { StatusCodes } from "http-status-codes";
import userAuth from "../middlewares/auth.ts";
import User from "../models/user.ts";
import {
  ChangePasswordSchema,
  DeleteAccountSchema,
  UpdateProfileSchema,
} from "../utils/profile.validator.ts";
import { z } from "zod";
import * as AuthService from "../services/auth.service.ts";

const router: Router = Router();

router.get("/view", userAuth, async (req: Request, res: Response) => {
  try {
    // get the user from the cookie
    const user = req.user;
    return res.status(StatusCodes.OK).json({ data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
});

router.patch("/edit", userAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = UpdateProfileSchema.parse(req.body);
    const loggedInUser = req.user!;

    // 1. Merge validated updates directly onto the user document
    Object.assign(loggedInUser, validatedData);

    // 2. Persist to MongoDB
    await loggedInUser.save();

    return res.status(StatusCodes.OK).json({ data: loggedInUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: error.issues });
    }
    console.error("Error updating profile:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
});

router.patch(
  "/edit/password",
  userAuth,
  async (req: Request, res: Response) => {
    try {
      // 1. Validate request body
      const { oldPassword, newPassword } = ChangePasswordSchema.parse(req.body);
      const loggedInUser = req.user!;

      // 2. Fetch user password explicitly to verify
      const user = await User.findById(loggedInUser._id).select("+password");
      if (!user) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "User not found" });
      }

      // 3. Verify old password
      const isPasswordValid = await AuthService.comparePassword(
        oldPassword,
        user.password,
      );
      if (!isPasswordValid) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "Incorrect current password" });
      }

      // 4. Prevent reusing the exact same password (optional best practice)
      if (oldPassword === newPassword) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "New password cannot be the same as old password" });
      }

      // 5. Hash new password & save
      user.password = await AuthService.hashPassword(newPassword);
      await user.save(); //because document is already in hand.

      return res
        .status(StatusCodes.OK)
        .json({ message: "Password updated successfully!" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ errors: error.issues });
      }
      console.error("Error updating password:", error);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error" });
    }
  },
);

router.delete("/", userAuth, async (req: Request, res: Response) => {
  try {
    const { password } = DeleteAccountSchema.parse(req.body);
    const loggedInUser = req.user!;
    // 1. Fetch user password explicitly to verify before destructive action
    const user = await User.findById(loggedInUser._id).select("+password");
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    }

    const isPasswordValid = await AuthService.comparePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Incorrect password. Cannot delete account." });
    }
    // 2. Delete the user
    await User.findByIdAndDelete(loggedInUser._id);
    // 3. Clear auth cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return res
      .status(StatusCodes.OK)
      .json({ message: "Account deleted successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: error.issues });
    }
    console.error("Error deleting user:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
});

export default router;
