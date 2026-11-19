import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password too long"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export const verifyEmailQuerySchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export type VerifyEmailQueryInput = z.infer<typeof verifyEmailQuerySchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .toLowerCase()
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(128),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const dateKeyRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createDiaryEntrySchema = z.object({
  dateKey: z.string().regex(dateKeyRegex, "Date must be in YYYY-MM-DD format"),
  timezone: z.string().default("UTC"),
  content: z.string().default(""),
});

export type CreateDiaryEntryInput = z.infer<typeof createDiaryEntrySchema>;

export const updateDiaryEntrySchema = z.object({
  content: z.string(),
  timezone: z.string().optional(),
});

export type UpdateDiaryEntryInput = z.infer<typeof updateDiaryEntrySchema>;

export const createTopicSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title is too long"),
  content: z.string().optional().default(""),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;

export const updateTopicSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
  content: z.string().optional(),
});

export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;

export const linkTopicSchema = z
  .object({
    topicPageId: z.string().optional(),
    newTopicTitle: z.string().trim().min(1).max(200).optional(),
  })
  .refine((data) => data.topicPageId || data.newTopicTitle, {
    message: "Either topicPageId or newTopicTitle must be provided",
  });

export type LinkTopicInput = z.infer<typeof linkTopicSchema>;

export const createNoteSchema = z.object({
  title: z.string().trim().default("Untitled Note"),
  content: z.string().default(""),
  folderId: z.string().nullable().optional(),
  tags: z.array(z.string().trim()).default([]),
  isPinned: z.boolean().default(false),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = z.object({
  title: z.string().trim().optional(),
  content: z.string().optional(),
  folderId: z.string().nullable().optional(),
  tags: z.array(z.string().trim()).optional(),
  isPinned: z.boolean().optional(),
});

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export const createFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Folder name is required")
    .max(100, "Folder name too long"),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;

export const updateFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Folder name is required")
    .max(100, "Folder name too long"),
});

export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
