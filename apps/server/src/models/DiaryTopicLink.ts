import mongoose, { Document, Schema, Types } from "mongoose";

export interface IDiaryTopicLink extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  diaryEntryId: Types.ObjectId;
  topicPageId: Types.ObjectId;
  createdAt: Date;
}

const diaryTopicLinkSchema = new Schema<IDiaryTopicLink>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    diaryEntryId: {
      type: Schema.Types.ObjectId,
      ref: "DiaryEntry",
      required: true,
      index: true,
    },
    topicPageId: {
      type: Schema.Types.ObjectId,
      ref: "TopicPage",
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.userId && ret.userId.toString)
          ret.userId = ret.userId.toString();
        if (ret.diaryEntryId && ret.diaryEntryId.toString)
          ret.diaryEntryId = ret.diaryEntryId.toString();
        if (ret.topicPageId && ret.topicPageId.toString)
          ret.topicPageId = ret.topicPageId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Unique compound index on (diaryEntryId, topicPageId)
diaryTopicLinkSchema.index(
  { diaryEntryId: 1, topicPageId: 1 },
  { unique: true },
);
diaryTopicLinkSchema.index({ topicPageId: 1, diaryEntryId: 1 });
diaryTopicLinkSchema.index({ userId: 1, diaryEntryId: 1 });
diaryTopicLinkSchema.index({ userId: 1, topicPageId: 1 });

export const DiaryTopicLinkModel = mongoose.model<IDiaryTopicLink>(
  "DiaryTopicLink",
  diaryTopicLinkSchema,
);
