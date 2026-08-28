import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
  type ErrorRequestHandler,
} from "express";
import connectDB from "./config/database.ts";
import User from "./models/user.ts";

const app: Express = express();

app.use(express.json());

app.post("/signup", async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, age, gender } = req.body;

    // const existingUser = await User.findOne({ email });
    // if (existingUser) {
    //   return res.status(400).json({ message: "User already exists" });
    // } Don't even need User.findOne({ email }) beforehand because the schema has unique: true which throws error code 11000 automatically.

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      age,
      gender,
    });
    await user.save();
    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/user", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/feed", async (req: Request, res: Response) => {
  try {
    const users = await User.find({});
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.patch("/user", async (req: Request, res: Response) => {
  try {
    const { userId, ...updates } = req.body; // Separate userId from whatever fields were passed

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      returnDocument: "after", // Returns the updated document instead of old one
      runValidators: true, // Enforces schema rules (e.g. enum: ["male", "female"])
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Updated user:", user);

    return res.status(200).json({
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/user", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Internal server error" });
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
