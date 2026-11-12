import React, { useState } from "react";
import { Search, Plus, BookOpen, Check } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useTopics } from "../hooks/useTopics";

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkExisting: (topicId: string) => Promise<void>;
  onCreateAndLink: (title: string) => Promise<void>;
  alreadyLinkedIds: Set<string>;
}

export const AddTopicModal: React.FC<AddTopicModalProps> = ({
  isOpen,
  onClose,
  onLinkExisting,
  onCreateAndLink,
  alreadyLinkedIds,
}) => {
  const [activeTab, setActiveTab] = useState<"create" | "link">("create");
  const [newTitle, setNewTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: topicsData, isLoading } = useTopics(searchTerm);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateAndLink(newTitle.trim());
      setNewTitle("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectExisting = async (topicId: string) => {
    setIsSubmitting(true);
    try {
      await onLinkExisting(topicId);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Related Topic">
      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-4">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 pb-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "create"
              ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Create New Topic
        </button>
        <button
          onClick={() => setActiveTab("link")}
          className={`flex-1 pb-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "link"
              ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Link Existing Topic
        </button>
      </div>

      {activeTab === "create" ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            A Topic Page is an ongoing page about a person, place, project, or
            memory connected to your diary entries.
          </p>

          <Input
            label="Topic Title"
            placeholder="e.g. Priya, Book Club, Trip to Tokyo"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create & Link
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search existing topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {isLoading ? (
              <p className="text-xs text-zinc-400 text-center py-4">
                Loading topics...
              </p>
            ) : !topicsData?.items?.length ? (
              <p className="text-xs text-zinc-400 text-center py-4">
                No topics found
              </p>
            ) : (
              topicsData.items.map((topic) => {
                const isLinked = alreadyLinkedIds.has(topic.id);
                return (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                          {topic.title}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {topic.diaryEntryCount || 0} connected entries
                        </p>
                      </div>
                    </div>

                    {isLinked ? (
                      <span className="flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3 text-emerald-500" />
                        Linked
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSelectExisting(topic.id)}
                        disabled={isSubmitting}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Link
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
