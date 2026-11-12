import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAttachment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  noteId?: Types.ObjectId | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  createdAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    noteId: {
      type: Schema.Types.ObjectId,
      ref: "Note",
      default: null,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.userId && ret.userId.toString)
          ret.userId = ret.userId.toString();
        if (ret.noteId && ret.noteId.toString)
          ret.noteId = ret.noteId.toString();
        ret.url = `/uploads/${ret.storageKey}`;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

attachmentSchema.index({ userId: 1, noteId: 1 });

export const AttachmentModel = mongoose.model<IAttachment>(
  "Attachment",
  attachmentSchema,
);
