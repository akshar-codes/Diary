import { Types } from "mongoose";
import { TopicPageModel, ITopicPage } from "../models/TopicPage";
import { DiaryEntryModel } from "../models/DiaryEntry";
import { DiaryTopicLinkModel } from "../models/DiaryTopicLink";
import { AppError } from "../middlewares/errorMiddleware";
import {
  CreateTopicInput,
  UpdateTopicInput,
  TopicPage,
  extractDatesFromContent,
  extractDatedLines,
} from "@notes/shared";

export class TopicService {
  private static async syncTopicDateLinks(
    userId: string,
    topicId: Types.ObjectId | string,
    content: string,
  ): Promise<void> {
    if (!content) return;
    const mentionedDates = extractDatesFromContent(content);
    if (!mentionedDates.length) return;

    for (const dateKey of mentionedDates) {
      let entry = await DiaryEntryModel.findOne({ userId, dateKey });
      if (!entry) {
        entry = await DiaryEntryModel.create({
          userId,
          dateKey,
          timezone: "UTC",
          content: "",
        });
      }

      await DiaryTopicLinkModel.findOneAndUpdate(
        { diaryEntryId: entry._id, topicPageId: topicId },
        {
          $setOnInsert: {
            userId,
            diaryEntryId: entry._id,
            topicPageId: topicId,
          },
        },
        { upsert: true, new: true },
      );
    }
  }

  private static async getRelatedDiaryDates(
    topicId: Types.ObjectId | string,
  ): Promise<{ id: string; dateKey: string }[]> {
    const links = await DiaryTopicLinkModel.find({ topicPageId: topicId }).sort(
      { createdAt: -1 },
    );
    if (!links.length) return [];

    const entryIds = links.map((l) => l.diaryEntryId);
    const entries = await DiaryEntryModel.find({ _id: { $in: entryIds } }).sort(
      { dateKey: -1 },
    );

    return entries.map((e) => ({
      id: e._id.toString(),
      dateKey: e.dateKey,
    }));
  }

  static async getTopics(
    userId: string,
    options: { search?: string; page?: number; limit?: number } = {},
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { userId };
    if (options.search) {
      query.title = { $regex: options.search, $options: "i" };
    }

    const [topics, total] = await Promise.all([
      TopicPageModel.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      TopicPageModel.countDocuments(query),
    ]);

    const formatted = await Promise.all(
      topics.map(async (topic) => {
        const related = await this.getRelatedDiaryDates(topic._id);
        const obj = topic.toJSON() as unknown as TopicPage;
        obj.diaryDates = related.map((r) => r.dateKey);
        obj.diaryEntryCount = related.length;
        obj.datedLines = extractDatedLines(topic.content);
        return obj;
      }),
    );

    return {
      items: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getTopicById(userId: string, id: string) {
    const topic = await TopicPageModel.findOne({ _id: id, userId });
    if (!topic) {
      throw new AppError("Topic page not found.", 404);
    }

    const related = await this.getRelatedDiaryDates(topic._id);
    const obj = topic.toJSON() as unknown as TopicPage & {
      relatedEntries: { id: string; dateKey: string }[];
    };
    obj.diaryDates = related.map((r) => r.dateKey);
    obj.diaryEntryCount = related.length;
    obj.relatedEntries = related;
    obj.datedLines = extractDatedLines(topic.content);
    return obj;
  }

  static async createTopic(
    userId: string,
    input: CreateTopicInput,
  ): Promise<TopicPage> {
    const topic = await TopicPageModel.create({
      userId,
      title: input.title,
      content: input.content || "",
    });

    if (input.content) {
      await this.syncTopicDateLinks(userId, topic._id, input.content);
    }

    const related = await this.getRelatedDiaryDates(topic._id);
    const obj = topic.toJSON() as unknown as TopicPage;
    obj.diaryDates = related.map((r) => r.dateKey);
    obj.diaryEntryCount = related.length;
    obj.datedLines = extractDatedLines(topic.content);
    return obj;
  }

  static async updateTopic(
    userId: string,
    id: string,
    input: UpdateTopicInput,
  ): Promise<TopicPage> {
    const topic = await TopicPageModel.findOne({ _id: id, userId });
    if (!topic) {
      throw new AppError("Topic page not found.", 404);
    }

    if (input.title !== undefined) topic.title = input.title;
    if (input.content !== undefined) topic.content = input.content;

    await topic.save();

    if (input.content !== undefined) {
      await this.syncTopicDateLinks(userId, topic._id, topic.content);
    }

    const related = await this.getRelatedDiaryDates(topic._id);
    const obj = topic.toJSON() as unknown as TopicPage;
    obj.diaryDates = related.map((r) => r.dateKey);
    obj.diaryEntryCount = related.length;
    obj.datedLines = extractDatedLines(topic.content);
    return obj;
  }

  static async deleteTopic(userId: string, id: string): Promise<void> {
    const topic = await TopicPageModel.findOne({ _id: id, userId });
    if (!topic) {
      throw new AppError("Topic page not found.", 404);
    }

    // Deleting a Topic Page must NOT delete associated Diary Entries
    await Promise.all([
      TopicPageModel.findByIdAndDelete(id),
      DiaryTopicLinkModel.deleteMany({ topicPageId: id }),
    ]);
  }

  static async linkTopicToEntry(
    userId: string,
    diaryEntryId: string,
    params: { topicPageId?: string; newTopicTitle?: string },
  ) {
    // Verify diary entry exists and belongs to user
    const entry = await DiaryEntryModel.findOne({ _id: diaryEntryId, userId });
    if (!entry) {
      throw new AppError("Diary entry not found.", 404);
    }

    let topicId = params.topicPageId;

    if (!topicId && params.newTopicTitle) {
      // Create new TopicPage
      const newTopic = await TopicPageModel.create({
        userId,
        title: params.newTopicTitle,
        content: "",
      });
      topicId = newTopic._id.toString();
    }

    if (!topicId) {
      throw new AppError(
        "Either topicPageId or newTopicTitle must be provided.",
        400,
      );
    }

    // Verify topic exists and belongs to user
    const topic = await TopicPageModel.findOne({ _id: topicId, userId });
    if (!topic) {
      throw new AppError(
        "Topic page not found or does not belong to you.",
        404,
      );
    }

    // Upsert relationship link
    await DiaryTopicLinkModel.findOneAndUpdate(
      { diaryEntryId: entry._id, topicPageId: topic._id },
      {
        $setOnInsert: {
          userId: entry.userId,
          diaryEntryId: entry._id,
          topicPageId: topic._id,
        },
      },
      { upsert: true, new: true },
    );

    return {
      id: topic._id.toString(),
      title: topic.title,
      content: topic.content,
      updatedAt: topic.updatedAt.toISOString(),
    };
  }

  static async unlinkTopicFromEntry(
    userId: string,
    diaryEntryId: string,
    topicPageId: string,
  ): Promise<void> {
    const link = await DiaryTopicLinkModel.findOne({
      userId,
      diaryEntryId,
      topicPageId,
    });

    if (!link) {
      throw new AppError("Relationship link not found.", 404);
    }

    await DiaryTopicLinkModel.findByIdAndDelete(link._id);
  }

  static async getEntryTopics(userId: string, diaryEntryId: string) {
    const entry = await DiaryEntryModel.findOne({ _id: diaryEntryId, userId });
    if (!entry) {
      throw new AppError("Diary entry not found.", 404);
    }

    const links = await DiaryTopicLinkModel.find({ diaryEntryId }).sort({
      createdAt: -1,
    });
    if (!links.length) return [];

    const topicIds = links.map((l) => l.topicPageId);
    const topics = await TopicPageModel.find({ _id: { $in: topicIds } });

    return topics.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      preview: t.content ? t.content.slice(0, 100) : "",
      updatedAt: t.updatedAt.toISOString(),
    }));
  }

  static async getTopicEntries(userId: string, topicPageId: string) {
    const topic = await TopicPageModel.findOne({ _id: topicPageId, userId });
    if (!topic) {
      throw new AppError("Topic page not found.", 404);
    }

    const links = await DiaryTopicLinkModel.find({ topicPageId }).sort({
      createdAt: -1,
    });
    if (!links.length) return [];

    const entryIds = links.map((l) => l.diaryEntryId);
    const entries = await DiaryEntryModel.find({ _id: { $in: entryIds } }).sort(
      { dateKey: -1 },
    );

    return entries.map((e) => ({
      id: e._id.toString(),
      dateKey: e.dateKey,
      preview: e.content ? e.content.slice(0, 100) : "",
      updatedAt: e.updatedAt.toISOString(),
    }));
  }
}
