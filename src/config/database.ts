import mongoose from "mongoose";

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error("Please provide MONGO_URI in environment variables");
  }
  const connectionInstance = await mongoose.connect(mongoURI);
  console.log(`MongoDB Connected: ${connectionInstance.connection.host}`);
};

export default connectDB;
