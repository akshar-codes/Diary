import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "express";
import { createApp } from "../app";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { UserModel } from "../models/User";
import { DiaryEntryModel } from "../models/DiaryEntry";
import { TopicPageModel } from "../models/TopicPage";
import { DiaryTopicLinkModel } from "../models/DiaryTopicLink";
import { NoteModel } from "../models/Note";
import { FolderModel } from "../models/Folder";

const TEST_DB_URI = "mongodb://127.0.0.1:27017/personal_diary_notes_test";

describe("Personal Diary & Notes API Suite", () => {
  let app: any;
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  beforeAll(async () => {
    await connectDatabase(TEST_DB_URI);
    // Clean test database and sync schema indexes
    await UserModel.syncIndexes();
    await Promise.all([
      UserModel.deleteMany({}),
      DiaryEntryModel.deleteMany({}),
      TopicPageModel.deleteMany({}),
      DiaryTopicLinkModel.deleteMany({}),
      NoteModel.deleteMany({}),
      FolderModel.deleteMany({}),
    ]);
    app = createApp();
  });

  afterAll(async () => {
    await Promise.all([
      UserModel.deleteMany({}),
      DiaryEntryModel.deleteMany({}),
      TopicPageModel.deleteMany({}),
      DiaryTopicLinkModel.deleteMany({}),
      NoteModel.deleteMany({}),
      FolderModel.deleteMany({}),
    ]);
    await disconnectDatabase();
  });

  describe("1. Authentication Module", () => {
    it("should register a new user and send verification email pending confirmation", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Alice Johnson",
        email: "alice@example.com",
        password: "password123",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.emailSent).toBe(true);
      expect(res.body.data.email).toBe("alice@example.com");
    });

    it("should reject login before email is verified", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "alice@example.com",
        password: "password123",
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.details?.code).toBe("EMAIL_NOT_VERIFIED");
    });

    it("should verify email using the verification token and issue tokens", async () => {
      const user = await UserModel.findOne({
        email: "alice@example.com",
      }).select("+emailVerifyToken");
      expect(user).toBeDefined();
      expect(user?.emailVerifyToken).toBeDefined();

      const res = await request(app)
        .get(`/api/v1/auth/verify-email?token=${user!.emailVerifyToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("alice@example.com");
      expect(res.body.data.tokens.accessToken).toBeDefined();

      user1Token = res.body.data.tokens.accessToken;
      user1Id = res.body.data.user.id;
    });

    it("should prevent duplicate registration with same verified email", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Alice Duplicate",
        email: "alice@example.com",
        password: "differentpassword",
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should login with correct credentials after verification", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "alice@example.com",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it("should reject login with wrong password", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "alice@example.com",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
    });

    it("should register and verify a second user for cross-user isolation tests", async () => {
      const registerRes = await request(app)
        .post("/api/v1/auth/register")
        .send({
          name: "Bob Smith",
          email: "bob@example.com",
          password: "password456",
        });

      expect(registerRes.status).toBe(201);

      const bobUser = await UserModel.findOne({
        email: "bob@example.com",
      }).select("+emailVerifyToken");
      expect(bobUser?.emailVerifyToken).toBeDefined();

      const verifyRes = await request(app)
        .get(`/api/v1/auth/verify-email?token=${bobUser!.emailVerifyToken}`)
        .send();

      expect(verifyRes.status).toBe(200);
      user2Token = verifyRes.body.data.tokens.accessToken;
      user2Id = verifyRes.body.data.user.id;
    });

    it("should reject resend-verification for already verified account", async () => {
      const res = await request(app)
        .post("/api/v1/auth/resend-verification")
        .send({ email: "alice@example.com" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should allow resend-verification for an unverified account", async () => {
      await request(app).post("/api/v1/auth/register").send({
        name: "Charlie Pending",
        email: "charlie@example.com",
        password: "password789",
      });

      const res = await request(app)
        .post("/api/v1/auth/resend-verification")
        .send({ email: "charlie@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.emailSent).toBe(true);
    });

    it("should handle oauth-failed redirect for web and android platforms", async () => {
      const webRes = await request(app).get(
        "/api/v1/auth/oauth-failed?platform=web",
      );
      expect(webRes.status).toBe(302);
      expect(webRes.headers.location).toContain("/login?error=oauth_failed");

      const androidRes = await request(app).get(
        "/api/v1/auth/oauth-failed?platform=android",
      );
      expect(androidRes.status).toBe(302);
      expect(androidRes.headers.location).toContain(
        "diaryapp://oauth/callback?error=oauth_failed",
      );
    });
  });

  describe("2. Diary Module & Topic Pages (Core Acceptance Criteria)", () => {
    let entryNov9Id: string;
    let entryNov12Id: string;
    let priyaTopicId: string;

    it("Scenario 1: User 1 creates daily entry for November 9", async () => {
      const res = await request(app)
        .post("/api/v1/diary/entries")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          dateKey: "2026-11-09",
          content: "Today I met Priya. We talked for some time.",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.dateKey).toBe("2026-11-09");
      entryNov9Id = res.body.data.id;
    });

    it('Scenario 2: User 1 creates Topic Page "Priya" from that entry', async () => {
      const res = await request(app)
        .post(`/api/v1/diary/entries/${entryNov9Id}/topics`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          newTopicTitle: "Priya",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Priya");
      priyaTopicId = res.body.data.id;
    });

    it("Scenario 3: User 1 opens Priya Topic Page and writes independent content", async () => {
      const res = await request(app)
        .patch(`/api/v1/diary/topics/${priyaTopicId}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          content:
            "Today I met Priya for the first time. We talked about hobbies.",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toContain("hobbies");
    });

    it("Scenario 4 & 5: Priya Topic Page appears under Related Topics in Nov 9 entry", async () => {
      const res = await request(app)
        .get(`/api/v1/diary/entries/${entryNov9Id}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.topics).toHaveLength(1);
      expect(res.body.data.topics[0].id).toBe(priyaTopicId);
      expect(res.body.data.topics[0].title).toBe("Priya");
    });

    it("Scenario 6 & 7: User 1 creates entry for Nov 12 and links EXISTING Priya page", async () => {
      // Create Nov 12 entry
      const nov12Res = await request(app)
        .post("/api/v1/diary/entries")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          dateKey: "2026-11-12",
          content: "Met Priya again today for coffee.",
        });
      entryNov12Id = nov12Res.body.data.id;

      // Link existing topic
      const linkRes = await request(app)
        .post(`/api/v1/diary/entries/${entryNov12Id}/topics`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          topicPageId: priyaTopicId,
        });

      expect(linkRes.status).toBe(201);
    });

    it("Scenario 8, 9, 10: Priya Topic Page shows both Nov 9 and Nov 12 entries", async () => {
      const res = await request(app)
        .get(`/api/v1/diary/topics/${priyaTopicId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.diaryDates).toContain("2026-11-09");
      expect(res.body.data.diaryDates).toContain("2026-11-12");
      expect(res.body.data.diaryEntryCount).toBe(2);
    });

    it("Scenario 11: Removing a link does NOT delete the Topic Page", async () => {
      const unlinkRes = await request(app)
        .delete(`/api/v1/diary/entries/${entryNov9Id}/topics/${priyaTopicId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(unlinkRes.status).toBe(200);

      // Verify Topic Page still exists and is still linked to Nov 12
      const topicRes = await request(app)
        .get(`/api/v1/diary/topics/${priyaTopicId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(topicRes.status).toBe(200);
      expect(topicRes.body.data.diaryDates).not.toContain("2026-11-09");
      expect(topicRes.body.data.diaryDates).toContain("2026-11-12");
    });

    it("Scenario 12: Deleting a daily entry does NOT delete its Topic Pages", async () => {
      const delRes = await request(app)
        .delete(`/api/v1/diary/entries/${entryNov12Id}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(delRes.status).toBe(200);

      // Verify Topic Page still exists
      const topicRes = await request(app)
        .get(`/api/v1/diary/topics/${priyaTopicId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(topicRes.status).toBe(200);
      expect(topicRes.body.data.title).toBe("Priya");
    });

    it("Security Isolation: User 2 cannot access User 1 Diary Entry or Topic Page", async () => {
      const res1 = await request(app)
        .get(`/api/v1/diary/entries/${entryNov9Id}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res1.status).toBe(404);

      const res2 = await request(app)
        .get(`/api/v1/diary/topics/${priyaTopicId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res2.status).toBe(404);
    });

    it("Scenario 13 (Topic-to-Date Relation): User creates a Topic with inline dated lines and auto-links to dates", async () => {
      // Create topic directly with dated lines
      const createRes = await request(app)
        .post("/api/v1/diary/topics")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          title: "Quantum Computing",
          content:
            "@2026-11-20 Read chapter 1 on qubits.\n@2026-11-21 Implemented Deutsch-Jozsa algorithm.",
        });

      expect(createRes.status).toBe(201);
      const topicId = createRes.body.data.id;
      expect(createRes.body.data.diaryDates).toContain("2026-11-20");
      expect(createRes.body.data.diaryDates).toContain("2026-11-21");
      expect(createRes.body.data.datedLines).toHaveLength(2);

      // Verify that navigating to 2026-11-20 daily journal shows this topic update
      const nov20Res = await request(app)
        .get("/api/v1/diary/entries/by-date/2026-11-20")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(nov20Res.status).toBe(200);
      expect(nov20Res.body.data.topicUpdates).toBeDefined();
      expect(nov20Res.body.data.topicUpdates).toHaveLength(1);
      expect(nov20Res.body.data.topicUpdates[0].topicTitle).toBe(
        "Quantum Computing",
      );
      expect(nov20Res.body.data.topicUpdates[0].lines).toContain(
        "Read chapter 1 on qubits.",
      );

      // Verify that navigating to 2026-11-21 daily journal shows the other line
      const nov21Res = await request(app)
        .get("/api/v1/diary/entries/by-date/2026-11-21")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(nov21Res.status).toBe(200);
      expect(nov21Res.body.data.topicUpdates).toBeDefined();
      expect(nov21Res.body.data.topicUpdates[0].lines).toContain(
        "Implemented Deutsch-Jozsa algorithm.",
      );

      // Verify cross-user isolation: User 2 on 2026-11-20 should not see User 1's updates
      const user2Nov20Res = await request(app)
        .get("/api/v1/diary/entries/by-date/2026-11-20")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(user2Nov20Res.body.data).toBeNull();
    });
  });

  describe("3. Regular Notes Module (Completely Independent)", () => {
    let noteId: string;
    let folderId: string;

    it("should create a folder for notes", async () => {
      const res = await request(app)
        .post("/api/v1/folders")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Work Projects" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Work Projects");
      folderId = res.body.data.id;
    });

    it("should create a standalone note with tags and folder", async () => {
      const res = await request(app)
        .post("/api/v1/notes")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          title: "Project Roadmap Q1",
          content: "Here are the deliverables for Q1...",
          folderId,
          tags: ["work", "planning"],
          isPinned: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Project Roadmap Q1");
      expect(res.body.data.isPinned).toBe(true);
      expect(res.body.data.tags).toContain("work");
      noteId = res.body.data.id;
    });

    it("should verify standalone notes do NOT appear in diary topics", async () => {
      const res = await request(app)
        .get("/api/v1/diary/topics")
        .set("Authorization", `Bearer ${user1Token}`);

      const titles = res.body.data.items.map((i: any) => i.title);
      expect(titles).not.toContain("Project Roadmap Q1");
    });

    it("should search notes by title, content, and tags", async () => {
      const res = await request(app)
        .get("/api/v1/notes?search=deliverables")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.items[0].id).toBe(noteId);
    });

    it("should soft delete note to trash and then restore it", async () => {
      // Soft delete
      const delRes = await request(app)
        .delete(`/api/v1/notes/${noteId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(delRes.status).toBe(200);

      // Verify active list does not show it
      const activeRes = await request(app)
        .get("/api/v1/notes?status=active")
        .set("Authorization", `Bearer ${user1Token}`);
      expect(
        activeRes.body.data.items.find((n: any) => n.id === noteId),
      ).toBeUndefined();

      // Verify trash list shows it
      const trashRes = await request(app)
        .get("/api/v1/notes?status=trash")
        .set("Authorization", `Bearer ${user1Token}`);
      expect(
        trashRes.body.data.items.find((n: any) => n.id === noteId),
      ).toBeDefined();

      // Restore
      const restoreRes = await request(app)
        .patch(`/api/v1/notes/${noteId}/restore`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.data.deletedAt).toBeNull();
    });

    it("should duplicate a note", async () => {
      const res = await request(app)
        .post(`/api/v1/notes/${noteId}/duplicate`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Project Roadmap Q1 (Copy)");
    });
  });

  describe("4. Settings and Data Export/Backup", () => {
    it("should export full user data as JSON", async () => {
      const res = await request(app)
        .get("/api/v1/users/export")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("alice@example.com");
      expect(res.body.data.diaryEntries.length).toBeGreaterThan(0);
      expect(res.body.data.topicPages.length).toBeGreaterThan(0);
      expect(res.body.data.notes.length).toBeGreaterThan(0);
      expect(res.body.data.folders.length).toBeGreaterThan(0);
    });
  });
});
