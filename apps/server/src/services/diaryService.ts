import { Types } from "mongoose";
import { DiaryEntryModel } from "../models/DiaryEntry";
import { DiaryTopicLinkModel } from "../models/DiaryTopicLink";
import { TopicPageModel } from "../models/TopicPage";
import { AppError } from "../middlewares/errorMiddleware";
import {
  CreateDiaryEntryInput,
  UpdateDiaryEntryInput,
  DiaryEntry,
  TopicPageSummary,
  TopicUpdateLine,
  extractLinesForDate,
} from "@notes/shared";

export class DiaryService {
  private static async getLinkedTopics(
    entryId: Types.ObjectId | string,
  ): Promise<TopicPageSummary[]> {
    const links = await DiaryTopicLinkModel.find({
      diaryEntryId: entryId,
    }).sort({ createdAt: -1 });
    if (!links.length) return [];

    const topicIds = links.map((l) => l.topicPageId);
    const topics = await TopicPageModel.find({ _id: { $in: topicIds } });

    // Map in link order
    const topicMap = new Map(topics.map((t) => [t._id.toString(), t]));
    return topicIds
      .map((id) => topicMap.get(id.toString()))
      .filter((t): t is NonNullable<typeof t> => !!t)
      .map((t) => ({
        id: t._id.toString(),
        title: t.title,
        preview: t.content ? t.content.slice(0, 100) : "",
        updatedAt: t.updatedAt.toISOString(),
      }));
  }

  private static async getTopicUpdatesForDate(
    userId: string,
    entryId: Types.ObjectId | string,
    dateKey: string,
  ): Promise<TopicUpdateLine[]> {
    const links = await DiaryTopicLinkModel.find({ diaryEntryId: entryId });
    if (!links.length) return [];

    const topicIds = links.map((l) => l.topicPageId);
    const topics = await TopicPageModel.find({
      _id: { $in: topicIds },
      userId,
    });

    const updates: TopicUpdateLine[] = [];
    for (const t of topics) {
      const lines = extractLinesForDate(t.content, dateKey);
      if (lines.length > 0) {
        updates.push({
          topicId: t._id.toString(),
          topicTitle: t.title,
          lines,
        });
      }
    }

    return updates;
  }

  static async getEntries(
    userId: string,
    options: { page?: number; limit?: number; search?: string } = {},
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { userId };
    if (options.search) {
      query.content = { $regex: options.search, $options: "i" };
    }

    const [entries, total] = await Promise.all([
      DiaryEntryModel.find(query).sort({ dateKey: -1 }).skip(skip).limit(limit),
      DiaryEntryModel.countDocuments(query),
    ]);

    const formatted = await Promise.all(
      entries.map(async (entry) => {
        const topics = await this.getLinkedTopics(entry._id);
        const obj = entry.toJSON() as unknown as DiaryEntry;
        obj.topics = topics;
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

  static async getEntryByDate(
    userId: string,
    dateKey: string,
  ): Promise<DiaryEntry | null> {
    let entry = await DiaryEntryModel.findOne({ userId, dateKey });

    // If entry doesn't exist yet, check if any topic has lines written for this dateKey
    if (!entry) {
      const userTopics = await TopicPageModel.find({ userId });
      const matchingTopics = userTopics.filter(
        (t) => extractLinesForDate(t.content, dateKey).length > 0,
      );

      if (matchingTopics.length > 0) {
        entry = await DiaryEntryModel.create({
          userId,
          dateKey,
          timezone: "UTC",
          content: "",
        });

        for (const mt of matchingTopics) {
          await DiaryTopicLinkModel.findOneAndUpdate(
            { diaryEntryId: entry._id, topicPageId: mt._id },
            {
              $setOnInsert: {
                userId,
                diaryEntryId: entry._id,
                topicPageId: mt._id,
              },
            },
            { upsert: true, new: true },
          );
        }
      }
    }

    if (!entry) return null;

    const [topics, topicUpdates] = await Promise.all([
      this.getLinkedTopics(entry._id),
      this.getTopicUpdatesForDate(userId, entry._id, dateKey),
    ]);

    const result = entry.toJSON() as unknown as DiaryEntry;
    result.topics = topics;
    result.topicUpdates = topicUpdates;
    return result;
  }

  static async getEntryById(userId: string, id: string): Promise<DiaryEntry> {
    const entry = await DiaryEntryModel.findOne({ _id: id, userId });
    if (!entry) {
      throw new AppError("Diary entry not found.", 404);
    }

    const [topics, topicUpdates] = await Promise.all([
      this.getLinkedTopics(entry._id),
      this.getTopicUpdatesForDate(userId, entry._id, entry.dateKey),
    ]);

    const result = entry.toJSON() as unknown as DiaryEntry;
    result.topics = topics;
    result.topicUpdates = topicUpdates;
    return result;
  }

  static async upsertEntry(
    userId: string,
    input: CreateDiaryEntryInput,
  ): Promise<DiaryEntry> {
    const entry = await DiaryEntryModel.findOneAndUpdate(
      { userId, dateKey: input.dateKey },
      {
        $set: {
          content: input.content,
          timezone: input.timezone || "UTC",
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    const [topics, topicUpdates] = await Promise.all([
      this.getLinkedTopics(entry._id),
      this.getTopicUpdatesForDate(userId, entry._id, entry.dateKey),
    ]);

    const result = entry.toJSON() as unknown as DiaryEntry;
    result.topics = topics;
    result.topicUpdates = topicUpdates;
    return result;
  }

  static async updateEntry(
    userId: string,
    id: string,
    input: UpdateDiaryEntryInput,
  ): Promise<DiaryEntry> {
    const entry = await DiaryEntryModel.findOne({ _id: id, userId });
    if (!entry) {
      throw new AppError("Diary entry not found.", 404);
    }

    if (input.content !== undefined) entry.content = input.content;
    if (input.timezone !== undefined) entry.timezone = input.timezone;

    await entry.save();

    const [topics, topicUpdates] = await Promise.all([
      this.getLinkedTopics(entry._id),
      this.getTopicUpdatesForDate(userId, entry._id, entry.dateKey),
    ]);

    const result = entry.toJSON() as unknown as DiaryEntry;
    result.topics = topics;
    result.topicUpdates = topicUpdates;
    return result;
  }

  static async deleteEntry(userId: string, id: string): Promise<void> {
    const entry = await DiaryEntryModel.findOne({ _id: id, userId });
    if (!entry) {
      throw new AppError("Diary entry not found.", 404);
    }

    // Deleting a daily entry must remove relationship links, NOT the Topic Pages
    await Promise.all([
      DiaryEntryModel.findByIdAndDelete(id),
      DiaryTopicLinkModel.deleteMany({ diaryEntryId: id }),
    ]);
  }

  static async getDatesSummary(
    userId: string,
    startKey?: string,
    endKey?: string,
  ) {
    const query: Record<string, unknown> = { userId };
    if (startKey || endKey) {
      query.dateKey = {};
      if (startKey) (query.dateKey as Record<string, string>).$gte = startKey;
      if (endKey) (query.dateKey as Record<string, string>).$lte = endKey;
    }

    const entries = await DiaryEntryModel.find(query).select(
      "dateKey _id content",
    );
    const entryIds = entries.map((e) => e._id);

    const links = await DiaryTopicLinkModel.aggregate([
      { $match: { diaryEntryId: { $in: entryIds } } },
      { $group: { _id: "$diaryEntryId", count: { $sum: 1 } } },
    ]);

    const linkCountMap = new Map(links.map((l) => [l._id.toString(), l.count]));

    return entries.map((e) => ({
      id: e._id.toString(),
      dateKey: e.dateKey,
      hasEntry:
        (e.content && e.content.trim().length > 0) ||
        (linkCountMap.get(e._id.toString()) || 0) > 0,
      topicCount: linkCountMap.get(e._id.toString()) || 0,
    }));
  }
}
