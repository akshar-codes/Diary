import React, { useState } from "react";
import { Search, Plus, BookOpen, ChevronRight, Calendar } from "lucide-react";
import { useTopics, useCreateTopic } from "../hooks/useTopics";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";

interface TopicsListViewProps {
  onSelectTopic: (topicId: string) => void;
}

export const TopicsListView: React.FC<TopicsListViewProps> = ({
  onSelectTopic,
}) => {
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");

  const { data: topicsData, isLoading } = useTopics(search);
  const createMutation = useCreateTopic();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    const topic = await createMutation.mutateAsync({
      title: newTopicTitle.trim(),
    });
    setNewTopicTitle("");
    setCreateModalOpen(false);
    onSelectTopic(topic.id);
  };

  return (
    <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full px-4 sm:px-8 py-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-zinc-200/80 dark:border-zinc-800/80 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Topic Pages
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Ongoing journals about people, subjects, trips, and memories
            connected to your daily entries.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          <span>New Topic</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="my-5 relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search topics..."
          className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
      </div>

      {/* Topics List */}
      <div className="flex-1 space-y-2">
        {isLoading ? (
          <div className="text-center py-12 text-xs text-zinc-400">
            Loading topics...
          </div>
        ) : !topicsData?.items?.length ? (
          <div className="text-center py-16 space-y-3">
            <BookOpen className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {search ? "No topics match your search" : "No topic pages yet"}
            </p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Create a Topic Page to record memories about a specific person,
              place or ongoing journey and link it across your diary.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCreateModalOpen(true)}
            >
              Create Your First Topic
            </Button>
          </div>
        ) : (
          topicsData.items.map((topic) => (
            <div
              key={topic.id}
              onClick={() => onSelectTopic(topic.id)}
              className="group flex items-center justify-between p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer transition-all shadow-xs"
            >
              <div className="space-y-1 min-w-0 pr-4">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                  {topic.title}
                </h4>
                {topic.content ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    {topic.content}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No notes yet</p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-zinc-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {topic.diaryEntryCount || 0} connected diary dates
                  </span>
                  <span>•</span>
                  <span>
                    Updated{" "}
                    {new Date(topic.updatedAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all shrink-0">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Topic Page"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Topic Title"
            placeholder="e.g. Priya, College Memories, Madrid Trip"
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            autoFocus
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending}
            >
              Create Topic
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
