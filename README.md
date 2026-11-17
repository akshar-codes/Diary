# Personal Diary & Notes Application

A clean, modern, minimal personal productivity system consisting of two independent main features:

1. **Diary** — A personal daily journal where users record daily entries and maintain ongoing topic-based pages connected across multiple diary entries (many-to-many relationship).
2. **Notes** — A completely independent, standalone notes workspace with folders, tags, pinning, search, markdown/rich-text formatting, archive, and soft-delete trash.

Available across **Web browsers (desktop, tablet, mobile)**, **Android**, and **iOS**, all synchronized through a unified TypeScript backend and MongoDB Atlas / local MongoDB database.

---

## Architecture Overview (Differentiated Across Tiers)

To ensure high cohesion, low coupling, and platform-native ergonomics, each application tier follows a distinct architecture:

```
my-journal/
├── apps/
│   ├── server/   # Layered Clean Architecture (Node.js, Express, Mongoose, Zod)
│   ├── web/      # Feature-Based Modular Architecture (React 18, Vite, Tailwind CSS)
│   └── mobile/   # Native-Centric Screen-Navigation Architecture (React Native, Expo)
└── packages/
    └── shared/   # Contract & Core Types (Domain Types, Zod Schemas, Date Utils)
```

### 1. Backend (`apps/server`) — Layered Architecture

- **Routes Layer**: Pure endpoint declaration and middleware binding (`/api/v1/*`).
- **Middleware Layer**: JWT authentication with refresh token rotation, Zod schema validation, IP rate limiting, Helmet security headers, centralized error handling.
- **Controller Layer**: HTTP request decoding, DTO validation, and response serialization.
- **Service Layer**: Pure business logic, transaction boundaries, relationship linkage, and access control.
- **Model / Data Layer**: Strongly typed Mongoose schemas with compound indexes (e.g. `{ userId: 1, dateKey: 1 }` unique constraint on Diary entries, and `{ diaryEntryId: 1, topicPageId: 1 }` on DiaryTopicLink).

### 2. Web Frontend (`apps/web`) — Feature-Based Modular Architecture

- **Feature Folders (`src/features/`)**:
  - `diary/`: DailyJournalEditor, CalendarPicker, RelatedTopicsSection, AddTopicModal, TopicEditor, TopicsListView.
  - `notes/`: NotesSidebar, NoteCard, NoteEditor, FormattingToolbar, FolderModal.
  - `settings/`: ProfileSection, SecuritySection, AppearanceSection, DataBackupSection.
  - `auth/`: LoginForm, RegisterForm.
- **Client State**:
  - **Server State**: TanStack Query v5 for cached server state, optimistic updates, and automatic invalidation.
  - **Local UI State**: Zustand stores for auth sessions (`authStore`) and theme mode (`themeStore` supporting Light, Dark, and System modes).
- **HTTP Layer**: Axios client configured with automatic Bearer token injection and transparent 401 refresh token rotation.
- **Design Language**: Neutral, warm stone/zinc palette inspired by Apple Notes and Simplenote.

### 3. Mobile App (`apps/mobile`) — Native-Centric Screen-Navigation Architecture

- **Navigation**: Dual-tier React Navigation architecture:
  - Root Stack for Authentication vs. Main App gating.
  - Bottom Tab Navigator for the 3 primary sections: **Diary**, **Notes**, **Settings**.
  - Nested Native Stacks for smooth transitions (e.g. `DiaryHome` -> `Topics` -> `TopicDetail`).
- **Native UX**: Comfortable touch targets (≥44pt), keyboard-aware editing views, native status bars, and safe-area context.
- **Security**: Tokens stored in encrypted hardware keystore/keychain via `expo-secure-store`.

---

## Database Design & Collections

### 1. `User`

```typescript
{
  _id: ObjectId,
  name: string,
  email: string,           // Unique index
  passwordHash: string,    // Excluded from query projections by default
  createdAt: Date,
  updatedAt: Date
}
```

### 2. `DiaryEntry`

```typescript
{
  _id: ObjectId,
  userId: ObjectId,        // References User
  dateKey: string,         // "YYYY-MM-DD"
  timezone: string,        // e.g. "Asia/Kolkata", "UTC"
  content: string,
  createdAt: Date,
  updatedAt: Date
}
// Unique compound index: (userId, dateKey) ensures 1 main entry per date
```

### 3. `TopicPage`

```typescript
{
  _id: ObjectId,
  userId: ObjectId,        // References User
  title: string,           // e.g. "Priya", "College Memories"
  content: string,         // Ongoing independent notes
  createdAt: Date,
  updatedAt: Date
}
```

### 4. `DiaryTopicLink` (Many-to-Many Bridge)

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  diaryEntryId: ObjectId,  // References DiaryEntry
  topicPageId: ObjectId,   // References TopicPage
  createdAt: Date
}
// Unique compound index: (diaryEntryId, topicPageId)
```

### 5. `Note` (Standalone Notes)

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  title: string,
  content: string,
  folderId: ObjectId | null,
  tags: string[],
  isPinned: boolean,
  archivedAt: Date | null,
  deletedAt: Date | null,  // Soft delete for Trash
  createdAt: Date,
  updatedAt: Date
}
```

### 6. `Folder`

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  name: string,
  createdAt: Date,
  updatedAt: Date
}
```

### 7. `Session`

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  refreshTokenHash: string,
  userAgent?: string,
  ipAddress?: string,
  lastActiveAt: Date,
  expiresAt: Date          // TTL index for automatic expiry
}
```

---

## Core Feature Flow: Diary & Topic Pages Linking

1. **Daily Entry Creation**: On `2026-11-09`, the user writes: _"Today I met Priya. We talked for some time."_
2. **Topic Creation & Linking**: In the **Related Topics** section, clicking **Add Related Topic** -> **Create New Topic** creates a topic named **"Priya"**.
3. **Independent Content**: Opening Priya's topic page allows writing detailed memory notes.
4. **Subsequent Entries**: On `2026-11-12`, the user creates another daily entry. Clicking **Add Related Topic** -> **Link Existing Topic** selects **"Priya"**.
5. **Bidirectional Navigation**:
   - Both November 9 and November 12 daily entries list "Priya →" under Related Topics.
   - Priya's Topic Page displays both November 9 and November 12 under "Related Diary Entries". Tapping either date immediately opens that day's journal entry.
6. **Independence**: Unlinking or deleting a daily entry does NOT delete the Topic Page. Deleting a Topic Page cleans up links but leaves daily journal entries intact.

---

## API Endpoints Reference (`/api/v1`)

### Authentication

| Method   | Endpoint             | Description                                     |
| -------- | -------------------- | ----------------------------------------------- |
| `POST`   | `/auth/register`     | Register new user account                       |
| `POST`   | `/auth/login`        | Login with email and password                   |
| `POST`   | `/auth/refresh`      | Rotate refresh token and issue new access token |
| `POST`   | `/auth/logout`       | Revoke active session                           |
| `GET`    | `/auth/me`           | Fetch authenticated user profile                |
| `GET`    | `/auth/sessions`     | List active sessions                            |
| `DELETE` | `/auth/sessions/:id` | Revoke specific session                         |

### Diary & Topics

| Method   | Endpoint                                  | Description                                                 |
| -------- | ----------------------------------------- | ----------------------------------------------------------- |
| `GET`    | `/diary/entries`                          | List daily entries (paginated, search)                      |
| `GET`    | `/diary/entries/summary`                  | Summary of dates with entries for calendar dots             |
| `GET`    | `/diary/entries/by-date/:date`            | Get daily entry for `YYYY-MM-DD` with linked topics         |
| `POST`   | `/diary/entries`                          | Upsert daily entry content for a date                       |
| `PATCH`  | `/diary/entries/:id`                      | Update daily entry                                          |
| `DELETE` | `/diary/entries/:id`                      | Delete entry (removes relationship links, preserves topics) |
| `GET`    | `/diary/topics`                           | List topic pages with search and entry counts               |
| `GET`    | `/diary/topics/:id`                       | Get topic page with associated diary dates                  |
| `POST`   | `/diary/topics`                           | Create new topic page                                       |
| `PATCH`  | `/diary/topics/:id`                       | Update topic title or content                               |
| `DELETE` | `/diary/topics/:id`                       | Delete topic page (preserves diary entries)                 |
| `POST`   | `/diary/entries/:id/topics`               | Link topic (existing or new) to diary entry                 |
| `DELETE` | `/diary/entries/:entryId/topics/:topicId` | Remove link between entry and topic                         |

### Notes, Folders & Tags

| Method   | Endpoint               | Description                                                                      |
| -------- | ---------------------- | -------------------------------------------------------------------------------- |
| `GET`    | `/notes`               | Get notes with status (`active`, `archived`, `trash`), folder, tag, search, sort |
| `POST`   | `/notes`               | Create standalone note                                                           |
| `GET`    | `/notes/:id`           | Get single note with folder and attachments                                      |
| `PATCH`  | `/notes/:id`           | Update note                                                                      |
| `DELETE` | `/notes/:id`           | Soft delete note to trash                                                        |
| `PATCH`  | `/notes/:id/pin`       | Toggle pin status                                                                |
| `PATCH`  | `/notes/:id/archive`   | Toggle archive status                                                            |
| `PATCH`  | `/notes/:id/restore`   | Restore note from trash                                                          |
| `DELETE` | `/notes/:id/permanent` | Permanently delete note                                                          |
| `DELETE` | `/notes/trash/empty`   | Empty all notes in trash                                                         |
| `POST`   | `/notes/:id/duplicate` | Duplicate note                                                                   |
| `GET`    | `/notes/tags`          | List distinct tags                                                               |
| `GET`    | `/folders`             | List folders with note counts                                                    |
| `POST`   | `/folders`             | Create folder                                                                    |
| `PATCH`  | `/folders/:id`         | Rename folder                                                                    |
| `DELETE` | `/folders/:id`         | Delete folder (sets note `folderId` to null)                                     |

### Settings & User

| Method   | Endpoint          | Description                              |
| -------- | ----------------- | ---------------------------------------- |
| `GET`    | `/users/profile`  | Get user profile                         |
| `PATCH`  | `/users/profile`  | Update user name / email                 |
| `PATCH`  | `/users/password` | Change password (revokes other sessions) |
| `GET`    | `/users/export`   | Download complete JSON backup            |
| `POST`   | `/users/restore`  | Restore data from JSON backup            |
| `DELETE` | `/users/account`  | Permanently delete account and all data  |

---

## Setup & Running Locally

### Prerequisites

- **Node.js**: v18+ (tested on v24)
- **pnpm**: v9+ (or `npm install -g pnpm`)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or MongoDB Atlas URI

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

Create `.env` inside `apps/server/`:

```bash
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/personal_diary_notes
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Build Shared Package

```bash
pnpm build:shared
```

### 4. Run Automated Test Suite

```bash
pnpm test
```

Runs 21 comprehensive integration tests covering auth, ownership checks, Scenario 1-12 Diary/Topic links, Notes CRUD, folders, and JSON data export.

### 5. Start Development Servers

- **Backend API**:

  ```bash
  pnpm dev:server
  ```

  Runs on `http://localhost:5000` (API base at `http://localhost:5000/api/v1`).

- **Web Application**:

  ```bash
  pnpm dev:web
  ```

  Runs on `http://localhost:5173`.

- **Mobile Application (Expo)**:
  ```bash
  pnpm dev:mobile
  ```
  Opens Expo dev tools. Press `a` for Android emulator, `i` for iOS simulator, or `w` for Web preview.

---

## Acceptance Criteria Verification Checklist

- [x] **Scenario 1**: User can create a daily entry for November 9.
- [x] **Scenario 2**: User can create a Topic Page called Priya from that entry.
- [x] **Scenario 3**: User can open Priya's Topic Page and write independent content.
- [x] **Scenario 4**: Priya Topic Page appears under Related Topics in November 9 entry.
- [x] **Scenario 5**: Clicking arrow/row opens the complete Priya Topic Page.
- [x] **Scenario 6**: User can create another entry for November 12.
- [x] **Scenario 7**: User can link existing Priya page to November 12 entry.
- [x] **Scenario 8**: Same Topic Page is accessible from both November 9 and November 12 entries.
- [x] **Scenario 9**: Editing Priya page updates the same page without duplicates.
- [x] **Scenario 10**: Topic Page displays all its associated diary dates (Nov 9, Nov 12).
- [x] **Scenario 11**: Removing a link does NOT delete the Topic Page.
- [x] **Scenario 12**: Deleting a daily entry does NOT delete its Topic Pages.
- [x] **Notes Module**: Standalone notes with folders, tags, pinning, search, archive, trash & restore, and duplicate.
- [x] **Separation of Concerns**: Standalone notes do NOT appear in Diary Topics; Diary Topic Pages do NOT appear in standalone Notes.
- [x] **Cross-Platform Synchronization**: Web and Mobile connect to the same backend REST API and persist to MongoDB.
