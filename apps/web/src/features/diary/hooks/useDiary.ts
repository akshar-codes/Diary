import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api/client";
import { DiaryEntry, DiaryDateSummary } from "@notes/shared";

export function useDiaryEntry(dateKey: string) {
  return useQuery({
    queryKey: ["diary-entry", dateKey],
    queryFn: async () => {
      const res = await apiClient.get(`/diary/entries/by-date/${dateKey}`);
      return (res.data.data as DiaryEntry) || null;
    },
    staleTime: 1000 * 60,
  });
}

export function useDatesSummary(startKey?: string, endKey?: string) {
  return useQuery({
    queryKey: ["diary-summary", startKey, endKey],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startKey) params.append("startKey", startKey);
      if (endKey) params.append("endKey", endKey);
      const res = await apiClient.get(
        `/diary/entries/summary?${params.toString()}`,
      );
      return (res.data.data as DiaryDateSummary[]) || [];
    },
  });
}

export function useSaveDiaryEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dateKey,
      content,
      timezone,
    }: {
      dateKey: string;
      content: string;
      timezone?: string;
    }) => {
      const res = await apiClient.post("/diary/entries", {
        dateKey,
        content,
        timezone,
      });
      return res.data.data as DiaryEntry;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["diary-entry", data.dateKey], data);
      queryClient.invalidateQueries({ queryKey: ["diary-summary"] });
    },
  });
}

export function useLinkTopicToEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entryId,
      topicPageId,
      newTopicTitle,
    }: {
      entryId: string;
      topicPageId?: string;
      newTopicTitle?: string;
    }) => {
      const res = await apiClient.post(`/diary/entries/${entryId}/topics`, {
        topicPageId,
        newTopicTitle,
      });
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["diary-entry"] });
      queryClient.invalidateQueries({ queryKey: ["diary-topics"] });
      queryClient.invalidateQueries({ queryKey: ["topic-detail"] });
      queryClient.invalidateQueries({ queryKey: ["diary-summary"] });
    },
  });
}

export function useUnlinkTopicFromEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entryId,
      topicId,
    }: {
      entryId: string;
      topicId: string;
    }) => {
      await apiClient.delete(`/diary/entries/${entryId}/topics/${topicId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-entry"] });
      queryClient.invalidateQueries({ queryKey: ["diary-topics"] });
      queryClient.invalidateQueries({ queryKey: ["topic-detail"] });
      queryClient.invalidateQueries({ queryKey: ["diary-summary"] });
    },
  });
}
