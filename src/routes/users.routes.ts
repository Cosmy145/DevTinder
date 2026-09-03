import { Router, type Request, type Response } from "express";
import { StatusCodes } from "http-status-codes";
import User from "../models/user.ts";
import userAuth from "../middlewares/auth.ts";
import ConnectionRequest from "../models/connectionRequest.ts";

const router: Router = Router();

const SAFE_USER_FIELDS = [
  "firstName",
  "lastName",
  "gender",
  "profilePicture",
  "age",
  "about",
  "skills",
  "city",
  "country",
];

router.get(
  "/requests/received",
  userAuth,
  async (req: Request, res: Response) => {
    try {
      const loggedInUserId = req.user!._id;

      const requests = await ConnectionRequest.find({
        receiver: loggedInUserId,
        status: "interested",
      }).populate("sender", SAFE_USER_FIELDS);
      return res
        .status(StatusCodes.OK)
        .json({ message: "Requests received", data: requests });
    } catch (error) {
      console.error("Error fetching received requests:", error);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error" });
    }
  },
);

router.get("/requests/sent", userAuth, async (req: Request, res: Response) => {
  try {
    const loggedInUserId = req.user!._id;

    const requests = await ConnectionRequest.find({
      sender: loggedInUserId,
      status: "interested",
    }).populate("receiver", SAFE_USER_FIELDS);
    return res
      .status(StatusCodes.OK)
      .json({ message: "Requests sent", data: requests });
  } catch (error) {
    console.error("Error fetching sent requests:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
});

router.get("/connections", userAuth, async (req: Request, res: Response) => {
  try {
    const loggedInUserId = req.user!._id;

    const connectionRequests = await ConnectionRequest.find({
      $or: [{ sender: loggedInUserId }, { receiver: loggedInUserId }],
      status: "accepted",
    })
      .populate("sender", SAFE_USER_FIELDS)
      .populate("receiver", SAFE_USER_FIELDS);

    // Extract the "other" user from each connection
    const connections = connectionRequests.map((row) => {
      if (row.sender._id.toString() === loggedInUserId.toString()) {
        // we can't just compare 2 mongodb id's raw, we have to convert them to strings first ig with .equals() maybe idk.
        return row.receiver;
      }
      return row.sender;
    });

    return res.status(StatusCodes.OK).json({
      message: "Connections fetched successfully",
      data: connections,
    });
  } catch (error) {
    console.error("Error fetching connections:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
});

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
