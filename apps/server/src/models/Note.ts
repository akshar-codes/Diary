import mongoose, { Document, Schema, Types } from "mongoose";

export interface INote extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  content: string;
  folderId?: Types.ObjectId | null;
  tags: string[];
  isPinned: boolean;
  archivedAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Untitled Note",
      trim: true,
      maxlength: 300,
    },
    content: {
      type: String,
      default: "",
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.userId && ret.userId.toString)
          ret.userId = ret.userId.toString();
        if (ret.folderId && ret.folderId.toString) {
          ret.folderId = ret.folderId.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

noteSchema.index({
  userId: 1,
  deletedAt: 1,
  archivedAt: 1,
  isPinned: -1,
  updatedAt: -1,
});
noteSchema.index({ userId: 1, folderId: 1, deletedAt: 1 });
noteSchema.index({ userId: 1, tags: 1, deletedAt: 1 });
noteSchema.index({ title: "text", content: "text" });

export const NoteModel = mongoose.model<INote>("Note", noteSchema);
