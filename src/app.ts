import express, { type Express } from "express";
import connectDB from "./config/database.ts";
import cookieParser from "cookie-parser";
import v1Router from "./routes/index.ts";

const app: Express = express();

app.use(express.json());

app.use(cookieParser());

app.use("/api/v1", v1Router);

connectDB()
  .then(() => {
    app.listen(3000, () => console.log("Server listening on port 3000"));
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1); // Stop server if DB fails to connect
    // code 0 is for success and code 1 is for failure
  });
