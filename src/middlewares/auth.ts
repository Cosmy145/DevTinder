import { type NextFunction, type Request, type Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import User from "../models/user.ts";
import { StatusCodes } from "http-status-codes";

interface DecodedToken extends JwtPayload {
  userId: string;
}

const userAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // read the token from the requests
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "JWT expired" });
    }
    // Verify the token
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret",
    ) as DecodedToken;
    // Find the user
    const user = await User.findById(decodedToken.userId);
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Invalid or expired token" });
  }
};

export default userAuth;
