import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api/client";
import {
  Note,
  NoteStatusFilter,
  NoteSortOption,
  PaginatedResult,
  CreateNoteInput,
  UpdateNoteInput,
} from "@notes/shared";

export interface UseNotesParams {
  status?: NoteStatusFilter;
  folderId?: string | null;
  tag?: string;
  isPinned?: boolean;
  search?: string;
  sort?: NoteSortOption;
  page?: number;
}

export function useNotes(params: UseNotesParams = {}) {
  return useQuery({
    queryKey: ["notes", params],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params.status) q.append("status", params.status);
      if (params.folderId !== undefined) {
        q.append(
          "folderId",
          params.folderId === null ? "none" : params.folderId,
        );
      }
      if (params.tag) q.append("tag", params.tag);
      if (params.isPinned !== undefined)
        q.append("isPinned", String(params.isPinned));
      if (params.search) q.append("search", params.search);
      if (params.sort) q.append("sort", params.sort);
      if (params.page) q.append("page", String(params.page));
      q.append("limit", "50");

      const res = await apiClient.get(`/notes?${q.toString()}`);
      return res.data.data as PaginatedResult<Note>;
    },
  });
}

export function useNoteDetail(id?: string | null) {
  return useQuery({
    queryKey: ["note", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/notes/${id}`);
      return res.data.data as Note;
    },
    enabled: Boolean(id),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      const res = await apiClient.post("/notes", input);
      return res.data.data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes-tags"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateNoteInput }) => {
      const res = await apiClient.patch(`/notes/${id}`, data);
      return res.data.data as Note;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["note", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["notes-tags"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useTrashNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useRestoreNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/notes/${id}/restore`);
      return res.data.data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function usePermanentDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/notes/${id}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete("/notes/trash/empty");
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useTogglePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/notes/${id}/pin`);
      return res.data.data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useToggleArchive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/notes/${id}/archive`);
      return res.data.data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useDuplicateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/notes/${id}/duplicate`);
      return res.data.data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["notes-tags"],
    queryFn: async () => {
      const res = await apiClient.get("/notes/tags");
      return (res.data.data as string[]) || [];
    },
  });
}
