import mongoose from "mongoose";
import { env } from "../config/env";
import { UserModel } from "../models/User";

async function migrate() {
  console.log("Connecting to database:", env.MONGO_URI);
  await mongoose.connect(env.MONGO_URI);

  const result = await UserModel.updateMany(
    {
      $or: [
        { provider: { $exists: false } },
        { emailVerified: { $exists: false } },
      ],
    },
    {
      $set: {
        provider: "email",
        emailVerified: true,
      },
    },
  );

  console.log(
    `Migration completed. Matched and updated ${result.modifiedCount} user(s).`,
  );
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
