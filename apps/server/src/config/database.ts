import mongoose from "mongoose";
import { env } from "./env";

export async function connectDatabase(
  uri = env.MONGO_URI,
): Promise<typeof mongoose> {
  try {
    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
    });
    return conn;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error);
  }
}
