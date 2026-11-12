import mongoose, { Document, Schema, Types } from "mongoose";

export interface IDiaryEntry extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  dateKey: string; // YYYY-MM-DD
  timezone: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const diaryEntrySchema = new Schema<IDiaryEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    content: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.userId && ret.userId.toString) {
          ret.userId = ret.userId.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Unique compound index on (userId, dateKey)
diaryEntrySchema.index({ userId: 1, dateKey: 1 }, { unique: true });
diaryEntrySchema.index({ userId: 1, createdAt: -1 });

export const DiaryEntryModel = mongoose.model<IDiaryEntry>(
  "DiaryEntry",
  diaryEntrySchema,
);
