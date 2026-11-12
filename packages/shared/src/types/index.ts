export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  lastActiveAt: string;
  expiresAt: string;
  createdAt: string;
  isCurrent?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface TopicDatedLine {
  dateKey: string;
  line: string;
  cleanLine: string;
}

export interface TopicUpdateLine {
  topicId: string;
  topicTitle: string;
  lines: string[];
}

export interface DiaryEntry {
  id: string;
  userId: string;
  dateKey: string; // YYYY-MM-DD
  timezone: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  topics?: TopicPageSummary[];
  topicUpdates?: TopicUpdateLine[];
}

export interface TopicPage {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  diaryDates?: string[];
  diaryEntryCount?: number;
  datedLines?: TopicDatedLine[];
}

export interface TopicPageSummary {
  id: string;
  title: string;
  preview?: string;
  updatedAt: string;
}

export interface DiaryTopicLink {
  id: string;
  userId: string;
  diaryEntryId: string;
  topicPageId: string;
  createdAt: string;
}

export interface DiaryDateSummary {
  dateKey: string;
  hasEntry: boolean;
  topicCount: number;
}

export interface NoteFolder {
  id: string;
  userId: string;
  name: string;
  noteCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteAttachment {
  id: string;
  userId: string;
  noteId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  url?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  folderId?: string | null;
  folder?: NoteFolder | null;
  tags: string[];
  isPinned: boolean;
  archivedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: NoteAttachment[];
}

export type NoteStatusFilter = "active" | "archived" | "trash";
export type NoteSortOption =
  | "updated_desc"
  | "updated_asc"
  | "created_desc"
  | "created_asc"
  | "title_asc"
  | "title_desc";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
