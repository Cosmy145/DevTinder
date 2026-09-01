import { Router, type Request, type Response } from "express";
import { StatusCodes } from "http-status-codes";
import User from "../models/user.ts";

const router: Router = Router();

router.get("/feed", async (req: Request, res: Response) => {
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

export default router;
