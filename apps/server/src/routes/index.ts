import { Router } from "express";
import authRoutes from "./authRoutes";
import diaryRoutes from "./diaryRoutes";
import topicRoutes from "./topicRoutes";
import noteRoutes from "./noteRoutes";
import folderRoutes from "./folderRoutes";
import userRoutes from "./userRoutes";
import attachmentRoutes from "./attachmentRoutes";
import releaseRoutes from "./releaseRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/releases", releaseRoutes);
router.use("/diary", topicRoutes); // mounted so /diary/topics works
router.use("/diary", diaryRoutes); // mounted so /diary/entries works
router.use("/notes", noteRoutes);
router.use("/folders", folderRoutes);
router.use("/users", userRoutes);
router.use("/attachments", attachmentRoutes);

export default router;
