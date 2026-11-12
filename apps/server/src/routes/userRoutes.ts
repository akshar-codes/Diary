import { Router } from "express";
import { UserController } from "../controllers/userController";
import { requireAuth } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import { updateProfileSchema, changePasswordSchema } from "@notes/shared";

const router = Router();

router.use(requireAuth);

router.get("/profile", UserController.getProfile);
router.patch(
  "/profile",
  validate(updateProfileSchema),
  UserController.updateProfile,
);
router.patch(
  "/password",
  validate(changePasswordSchema),
  UserController.changePassword,
);
router.get("/export", UserController.exportData);
router.post("/restore", UserController.restoreData);
router.delete("/account", UserController.deleteAccount);

export default router;
