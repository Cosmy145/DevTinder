import { z } from "zod";
import mongoose from "mongoose";

// Helper for MongoDB ObjectId validation
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid MongoDB ObjectId",
  });

export const SendConnectionRequestSchema = z.object({
  status: z.enum(["interested", "ignored"]),
  userId: objectIdSchema,
});

export const ReviewConnectionRequestSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
  requestId: objectIdSchema,
});

export type ISendConnectionRequest = z.infer<
  typeof SendConnectionRequestSchema
>;
export type IReviewConnectionRequest = z.infer<
  typeof ReviewConnectionRequestSchema
>;
