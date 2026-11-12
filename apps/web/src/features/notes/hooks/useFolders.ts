import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api/client";
import {
  NoteFolder,
  CreateFolderInput,
  UpdateFolderInput,
} from "@notes/shared";

export function useFolders() {
  return useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const res = await apiClient.get("/folders");
      return (res.data.data as NoteFolder[]) || [];
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFolderInput) => {
      const res = await apiClient.post("/folders", input);
      return res.data.data as NoteFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateFolderInput;
    }) => {
      const res = await apiClient.patch(`/folders/${id}`, data);
      return res.data.data as NoteFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/folders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
