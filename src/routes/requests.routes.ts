import { Router, type Request, type Response } from "express";
import userAuth from "../middlewares/auth.ts";
import { StatusCodes } from "http-status-codes";
import ConnectionRequest from "../models/connectionRequest.ts";
import mongoose from "mongoose";
import { SendConnectionRequestSchema } from "../utils/request.validator.ts";
import z from "zod";
import User from "../models/user.ts";

const router: Router = Router();

router.post(
  "/send/:status/:userId",
  userAuth,
  async (req: Request, res: Response) => {
    try {
      // 1. Validate the params
      const validatedParams = SendConnectionRequestSchema.parse(req.params);
      const { status, userId } = validatedParams;
      const loggedInUser = req.user!;

      // 2. Check if the user is trying to send a request to themselves
      if (loggedInUser._id.toString() === userId) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "You cannot send a request to yourself" });
      }
      // 3. Check if target user even exists
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "User not found" });
      }

      // 4. Check if a request already exists between the two users
      const existingRequest = await ConnectionRequest.findOne({
        $or: [
          { sender: loggedInUser._id, receiver: userId },
          { sender: userId, receiver: loggedInUser._id },
        ],
      });

      if (existingRequest) {
        return res.status(StatusCodes.CONFLICT).json({
          message: "A connection request already exists between these users",
        });
      }

      // 5. Create and persist connection request
      const connectionRequest = await ConnectionRequest.create({
        sender: loggedInUser._id,
        receiver: userId,
        status,
      });

      const message =
        status === "interested"
          ? `You showed interest in ${targetUser.firstName}`
          : `You ignored ${targetUser.firstName}`;

      return res.status(StatusCodes.CREATED).json({
        message,
        data: connectionRequest,
      });

      return res.status(StatusCodes.CREATED).json({
        message: `Connection request ${status} successfully`,
        data: connectionRequest,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ errors: error.issues });
      }
      console.error("Error sending request:", error);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error" });
    }
  },
);

export default router;
