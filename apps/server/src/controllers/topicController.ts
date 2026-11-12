import { Request, Response, NextFunction } from "express";
import { TopicService } from "../services/topicService";

export class TopicController {
  static async getTopics(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;
      const search = req.query.search as string | undefined;

      const result = await TopicService.getTopics(req.userId!, {
        search,
        page,
        limit,
      });
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTopicById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const topic = await TopicService.getTopicById(req.userId!, id);
      res.json({
        success: true,
        data: topic,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createTopic(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const topic = await TopicService.createTopic(req.userId!, req.body);
      res.status(201).json({
        success: true,
        message: "Topic page created",
        data: topic,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTopic(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const topic = await TopicService.updateTopic(req.userId!, id, req.body);
      res.json({
        success: true,
        message: "Topic page updated",
        data: topic,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTopic(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      await TopicService.deleteTopic(req.userId!, id);
      res.json({
        success: true,
        message: "Topic page deleted",
      });
    } catch (error) {
      next(error);
    }
  }

  static async linkTopicToEntry(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params; // diary entry id
      const topic = await TopicService.linkTopicToEntry(
        req.userId!,
        id,
        req.body,
      );
      res.status(201).json({
        success: true,
        message: "Topic linked to diary entry",
        data: topic,
      });
    } catch (error) {
      next(error);
    }
  }

  static async unlinkTopicFromEntry(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { entryId, topicId } = req.params;
      await TopicService.unlinkTopicFromEntry(req.userId!, entryId, topicId);
      res.json({
        success: true,
        message: "Topic unlinked from diary entry",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEntryTopics(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const topics = await TopicService.getEntryTopics(req.userId!, id);
      res.json({
        success: true,
        data: topics,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTopicEntries(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const entries = await TopicService.getTopicEntries(req.userId!, id);
      res.json({
        success: true,
        data: entries,
      });
    } catch (error) {
      next(error);
    }
  }
}
