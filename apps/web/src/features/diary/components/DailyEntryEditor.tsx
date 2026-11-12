import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Layers,
  ExternalLink,
  Bookmark,
} from "lucide-react";
import {
  formatDisplayDate,
  shiftDateKey,
  getTodayDateKey,
} from "@notes/shared";
import {
  useDiaryEntry,
  useSaveDiaryEntry,
  useLinkTopicToEntry,
  useUnlinkTopicFromEntry,
} from "../hooks/useDiary";
import { RelatedTopicsSection } from "./RelatedTopicsSection";
import {
  AutosaveBadge,
  SaveStatus,
} from "../../../components/common/AutosaveBadge";

interface DailyEntryEditorProps {
  dateKey: string;
  onSelectDate: (dateKey: string) => void;
  onOpenTopic: (topicId: string) => void;
}

export const DailyEntryEditor: React.FC<DailyEntryEditorProps> = ({
  dateKey,
  onSelectDate,
  onOpenTopic,
}) => {
  const { data: entry, isLoading } = useDiaryEntry(dateKey);
  const saveMutation = useSaveDiaryEntry();
  const linkTopicMutation = useLinkTopicToEntry();
  const unlinkTopicMutation = useUnlinkTopicFromEntry();

  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>("");

  // Sync content when date changes or entry loads
  useEffect(() => {
    if (entry) {
      setContent(entry.content || "");
      lastSavedContentRef.current = entry.content || "";
      setSaveStatus("idle");
    } else if (!isLoading) {
      setContent("");
      lastSavedContentRef.current = "";
      setSaveStatus("idle");
    }
  }, [entry, dateKey, isLoading]);

  // Autosave handler with 800ms debounce
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (newContent !== lastSavedContentRef.current) {
      setSaveStatus("unsaved");

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        setSaveStatus("saving");
        try {
          await saveMutation.mutateAsync({
            dateKey,
            content: newContent,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
          lastSavedContentRef.current = newContent;
          setSaveStatus("saved");
          setLastSavedAt(new Date());
        } catch {
          setSaveStatus("error");
        }
      }, 800);
    }
  };

  const handleLinkExisting = async (topicId: string) => {
    if (!entry) {
      // Create entry first if not yet created
      const newEntry = await saveMutation.mutateAsync({
        dateKey,
        content,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      await linkTopicMutation.mutateAsync({
        entryId: newEntry.id,
        topicPageId: topicId,
      });
    } else {
      await linkTopicMutation.mutateAsync({
        entryId: entry.id,
        topicPageId: topicId,
      });
    }
  };

  const handleCreateAndLink = async (title: string) => {
    if (!entry) {
      const newEntry = await saveMutation.mutateAsync({
        dateKey,
        content,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      await linkTopicMutation.mutateAsync({
        entryId: newEntry.id,
        newTopicTitle: title,
      });
    } else {
      await linkTopicMutation.mutateAsync({
        entryId: entry.id,
        newTopicTitle: title,
      });
    }
  };

  const handleUnlink = async (topicId: string) => {
    if (entry) {
      await unlinkTopicMutation.mutateAsync({
        entryId: entry.id,
        topicId,
      });
    }
  };

  const todayKey = getTodayDateKey();
  const isToday = dateKey === todayKey;

  return (
    <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full px-4 sm:px-8 py-6 overflow-y-auto">
      {/* Date Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between pb-6 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectDate(shiftDateKey(dateKey, -1))}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectDate(shiftDateKey(dateKey, 1))}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={() => onSelectDate(todayKey)}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* Autosave Status */}
        <AutosaveBadge status={saveStatus} lastSavedAt={lastSavedAt} />
      </div>

      {/* Date Title */}
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-serif">
          {formatDisplayDate(dateKey)}
        </h2>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Daily Journal Entry
        </span>
      </div>

      {/* Writing Area */}
      <div className="flex-1 min-h-[320px] flex flex-col mb-8">
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Write about your day, experiences, thoughts, and reflections..."
          className="w-full flex-1 min-h-[300px] resize-none bg-transparent text-base sm:text-lg leading-relaxed text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none font-serif"
        />
      </div>

      {/* Topic Updates for this Day (Written in Topic Pages) */}
      {entry?.topicUpdates && entry.topicUpdates.length > 0 && (
        <div className="mb-8 p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Topic Updates for this Day ({entry.topicUpdates.length})
              </h3>
            </div>
            <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
              Lines attached to this date from Topics
            </span>
          </div>

          <div className="space-y-3">
            {entry.topicUpdates.map((update) => (
              <div
                key={update.topicId}
                className="p-3.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40 bg-white dark:bg-zinc-900 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {update.topicTitle}
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenTopic(update.topicId)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline transition-colors"
                  >
                    <span>View Topic</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <ul className="space-y-1.5 pl-3 border-l-2 border-amber-200 dark:border-amber-800 text-sm text-zinc-700 dark:text-zinc-300 font-serif">
                  {update.lines.map((line, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Topics Section */}
      <RelatedTopicsSection
        topics={entry?.topics || []}
        onOpenTopic={onOpenTopic}
        onLinkExisting={handleLinkExisting}
        onCreateAndLink={handleCreateAndLink}
        onUnlinkTopic={handleUnlink}
      />
    </div>
  );
};
