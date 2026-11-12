import { Router } from "express";
import { TopicController } from "../controllers/topicController";
import { requireAuth } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import { createTopicSchema, updateTopicSchema } from "@notes/shared";

const router = Router();

// All topic routes require authentication
router.use(requireAuth);

router.get("/topics", TopicController.getTopics);
router.get("/topics/:id", TopicController.getTopicById);
router.post(
  "/topics",
  validate(createTopicSchema),
  TopicController.createTopic,
);
router.patch(
  "/topics/:id",
  validate(updateTopicSchema),
  TopicController.updateTopic,
);
router.delete("/topics/:id", TopicController.deleteTopic);

// Get all entries linked to this topic
router.get("/topics/:id/entries", TopicController.getTopicEntries);

export default router;
