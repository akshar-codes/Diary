import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api/client";
import { TopicPage, PaginatedResult } from "@notes/shared";

export function useTopics(search?: string, page = 1) {
  return useQuery({
    queryKey: ["diary-topics", search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("page", page.toString());
      params.append("limit", "50");
      const res = await apiClient.get(`/diary/topics?${params.toString()}`);
      return res.data.data as PaginatedResult<TopicPage>;
    },
  });
}

export function useTopicDetail(id?: string) {
  return useQuery({
    queryKey: ["topic-detail", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/diary/topics/${id}`);
      return res.data.data as TopicPage & {
        relatedEntries: { id: string; dateKey: string }[];
      };
    },
    enabled: Boolean(id),
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      content,
    }: {
      title: string;
      content?: string;
    }) => {
      const res = await apiClient.post("/diary/topics", { title, content });
      return res.data.data as TopicPage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-topics"] });
      queryClient.invalidateQueries({ queryKey: ["diary-entry"] });
      queryClient.invalidateQueries({ queryKey: ["diary-summary"] });
    },
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      content,
    }: {
      id: string;
      title?: string;
      content?: string;
    }) => {
      const res = await apiClient.patch(`/diary/topics/${id}`, {
        title,
        content,
      });
      return res.data.data as TopicPage;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["topic-detail", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["diary-topics"] });
      queryClient.invalidateQueries({ queryKey: ["diary-entry"] });
      queryClient.invalidateQueries({ queryKey: ["diary-summary"] });
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/diary/topics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-topics"] });
      queryClient.invalidateQueries({ queryKey: ["diary-entry"] });
      queryClient.invalidateQueries({ queryKey: ["diary-summary"] });
    },
  });
}
