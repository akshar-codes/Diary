export function getTodayDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidDateKey(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str + "T00:00:00Z");
  return !isNaN(d.getTime());
}

export function formatDisplayDate(dateKeyOrIso: string): string {
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateKeyOrIso)) {
      const [year, month, day] = dateKeyOrIso.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    const d = new Date(dateKeyOrIso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateKeyOrIso;
  }
}

export function formatShortDate(dateKey: string): string {
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      const [year, month, day] = dateKey.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return dateKey;
  } catch {
    return dateKey;
  }
}

export function extractPreviewText(content: string, maxLength = 140): string {
  if (!content) return "";
  // Strip simple markdown tokens like #, *, _, `, [], ()
  const plain = content
    .replace(/#+\s+/g, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).trimEnd() + "...";
}

export function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return getTodayDateKey(d);
}

/**
 * Regex matching inline date tags like @2026-11-09 or [2026-11-09]
 */
export const DATE_TAG_REGEX =
  /(?:@(\d{4}-\d{2}-\d{2})\b|\[(\d{4}-\d{2}-\d{2})\])/g;

/**
 * Replace shortcuts like @today, @yesterday, @tomorrow with actual date keys
 */
export function expandDateShortcuts(text: string): string {
  if (!text) return "";
  const today = getTodayDateKey();
  const yesterday = shiftDateKey(today, -1);
  const tomorrow = shiftDateKey(today, 1);

  return text
    .replace(/(^|\s)@today\b/gi, `$1@${today}`)
    .replace(/(^|\s)@yesterday\b/gi, `$1@${yesterday}`)
    .replace(/(^|\s)@tomorrow\b/gi, `$1@${tomorrow}`);
}

/**
 * Strips date tags from a line to display the clean text
 */
export function stripDateTags(line: string): string {
  if (!line) return "";
  return line
    .replace(/(?:@\d{4}-\d{2}-\d{2}\b|\[\d{4}-\d{2}-\d{2}\])/g, "")
    .trim();
}

/**
 * Extract all unique valid date keys from content
 */
export function extractDatesFromContent(content: string): string[] {
  if (!content) return [];
  const matches = new Set<string>();
  const regex = new RegExp(DATE_TAG_REGEX.source, "g");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const dateKey = match[1] || match[2];
    if (dateKey && isValidDateKey(dateKey)) {
      matches.add(dateKey);
    }
  }

  return Array.from(matches).sort();
}

/**
 * Extract all lines that have an attached date tag
 */
export function extractDatedLines(
  content: string,
): { dateKey: string; line: string; cleanLine: string }[] {
  if (!content) return [];
  const lines = content.split("\n");
  const results: { dateKey: string; line: string; cleanLine: string }[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const regex = new RegExp(DATE_TAG_REGEX.source, "g");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(trimmed)) !== null) {
      const dateKey = match[1] || match[2];
      if (dateKey && isValidDateKey(dateKey)) {
        results.push({
          dateKey,
          line: trimmed,
          cleanLine: stripDateTags(trimmed),
        });
      }
    }
  }

  return results;
}

/**
 * Extract lines from content that match a specific dateKey
 */
export function extractLinesForDate(
  content: string,
  targetDateKey: string,
): string[] {
  if (!content || !targetDateKey) return [];
  const lines = content.split("\n");
  const matchingLines: string[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const regex = new RegExp(DATE_TAG_REGEX.source, "g");
    let match: RegExpExecArray | null;
    let hasTargetDate = false;

    while ((match = regex.exec(trimmed)) !== null) {
      const dateKey = match[1] || match[2];
      if (dateKey === targetDateKey) {
        hasTargetDate = true;
        break;
      }
    }

    if (hasTargetDate) {
      matchingLines.push(stripDateTags(trimmed));
    }
  }

  return matchingLines;
}
