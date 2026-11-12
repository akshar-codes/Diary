import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITopicPage extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const topicPageSchema = new Schema<ITopicPage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
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

topicPageSchema.index({ userId: 1, title: 1 });
topicPageSchema.index({ userId: 1, updatedAt: -1 });

export const TopicPageModel = mongoose.model<ITopicPage>(
  "TopicPage",
  topicPageSchema,
);
