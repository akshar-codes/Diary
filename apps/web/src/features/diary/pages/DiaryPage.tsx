import React, { useState } from "react";
import {
  BookOpen,
  Calendar,
  Tag,
  Layers,
  ChevronDown,
  Search,
} from "lucide-react";
import { getTodayDateKey } from "@notes/shared";
import { CalendarPicker } from "../components/CalendarPicker";
import { DailyEntryEditor } from "../components/DailyEntryEditor";
import { TopicsListView } from "../components/TopicsListView";
import { TopicEditor } from "../components/TopicEditor";
import { DiarySearchModal } from "../components/DiarySearchModal";
import { useDatesSummary } from "../hooks/useDiary";

export const DiaryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"daily" | "topics">("daily");
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    getTodayDateKey(),
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const { data: summaryData } = useDatesSummary();
  const datesWithEntries = new Set(
    (summaryData || []).filter((s) => s.hasEntry).map((s) => s.dateKey),
  );

  const handleOpenTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    setActiveTab("topics");
  };

  const handleNavigateToDate = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    setActiveTab("daily");
    setSelectedTopicId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Top Diary Subheader / Tabs */}
      <div className="h-12 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xs flex items-center justify-between px-4 sm:px-8 z-10 shrink-0">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => {
              setActiveTab("daily");
              setSelectedTopicId(null);
            }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === "daily"
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Journal</span>
          </button>

          <button
            onClick={() => setActiveTab("topics")}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === "topics"
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Topics</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "daily" && (
            <button
              onClick={() => setSearchModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Search Diary entries"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search Diary</span>
            </button>
          )}

          {activeTab === "daily" && (
            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              className="lg:hidden inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {activeTab === "daily" ? (
          <>
            {/* Desktop Left Calendar Sidebar */}
            <div className="hidden lg:block w-72 p-6 border-r border-zinc-200/70 dark:border-zinc-800/70 shrink-0 overflow-y-auto">
              <CalendarPicker
                selectedDateKey={selectedDateKey}
                onSelectDate={setSelectedDateKey}
                datesWithEntries={datesWithEntries}
              />
              <div className="mt-4 p-3 rounded-lg bg-zinc-100/60 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Tip: Dates with a dot mark existing entries. You can jump to
                  any past date from the calendar.
                </p>
              </div>
            </div>

            {/* Mobile Calendar Popover */}
            {calendarOpen && (
              <div className="lg:hidden absolute top-2 left-4 right-4 z-20">
                <CalendarPicker
                  selectedDateKey={selectedDateKey}
                  onSelectDate={(d) => {
                    setSelectedDateKey(d);
                    setCalendarOpen(false);
                  }}
                  datesWithEntries={datesWithEntries}
                />
              </div>
            )}

            {/* Main Daily Journal Editor */}
            <DailyEntryEditor
              dateKey={selectedDateKey}
              onSelectDate={setSelectedDateKey}
              onOpenTopic={handleOpenTopic}
            />
          </>
        ) : selectedTopicId ? (
          <TopicEditor
            topicId={selectedTopicId}
            onBack={() => setSelectedTopicId(null)}
            onNavigateToDate={handleNavigateToDate}
          />
        ) : (
          <TopicsListView onSelectTopic={(id) => setSelectedTopicId(id)} />
        )}
      </div>

      {/* Search Modal */}
      <DiarySearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectDate={handleNavigateToDate}
      />
    </div>
  );
};
