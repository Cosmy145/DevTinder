import { Router, type Request, type Response } from "express";
import { StatusCodes } from "http-status-codes";
import userAuth from "../middlewares/auth.ts";
import User from "../models/user.ts";
import {
  ChangePasswordSchema,
  DeleteAccountSchema,
  UpdateProfileSchema,
} from "../utils/validator.ts";
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
    // Zod validates everything, drops unknown/hacker keys, and type-checks!
    const validatedData = UpdateProfileSchema.parse(req.body);

    const user = await User.findByIdAndUpdate(req.user!._id, validatedData, {
      returnDocument: "after",
    });

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found after update" });
    }

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
      await user.save();

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
