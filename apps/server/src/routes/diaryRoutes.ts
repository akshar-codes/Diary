import { Router } from "express";
import { DiaryController } from "../controllers/diaryController";
import { TopicController } from "../controllers/topicController";
import { requireAuth } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import {
  createDiaryEntrySchema,
  updateDiaryEntrySchema,
  linkTopicSchema,
} from "@notes/shared";

const router = Router();

// All diary routes require authentication
router.use(requireAuth);

// Summary of dates for calendar
router.get("/entries/summary", DiaryController.getDatesSummary);

// Entries
router.get("/entries", DiaryController.getEntries);
router.get("/entries/by-date/:date", DiaryController.getEntryByDate);
router.get("/entries/:id", DiaryController.getEntryById);
router.post(
  "/entries",
  validate(createDiaryEntrySchema),
  DiaryController.upsertEntry,
);
router.patch(
  "/entries/:id",
  validate(updateDiaryEntrySchema),
  DiaryController.updateEntry,
);
router.delete("/entries/:id", DiaryController.deleteEntry);

// Relationships on entries
router.get("/entries/:id/topics", TopicController.getEntryTopics);
router.post(
  "/entries/:id/topics",
  validate(linkTopicSchema),
  TopicController.linkTopicToEntry,
);
router.delete(
  "/entries/:entryId/topics/:topicId",
  TopicController.unlinkTopicFromEntry,
);

export default router;
