import api from "./api";
import type { Attachment, Message, Session } from "@/types/chat";

export const chatApi = {
  createSession(data: { title?: string; model_provider?: string; model_name?: string }) {
    return api.post<Session>("/chat/sessions", data);
  },
  listSessions() {
    return api.get<Session[]>("/chat/sessions");
  },
  getSession(sessionId: string) {
    return api.get<Session>(`/chat/sessions/${sessionId}`);
  },
  updateSession(sessionId: string, data: { title?: string; is_archived?: boolean }) {
    return api.patch<Session>(`/chat/sessions/${sessionId}`, data);
  },
  deleteSession(sessionId: string) {
    return api.delete(`/chat/sessions/${sessionId}`);
  },
  getMessages(sessionId: string) {
    return api.get<Message[]>(`/chat/sessions/${sessionId}/messages`);
  },
  generateTitle(sessionId: string) {
    return api.post<{ title: string }>(`/chat/sessions/${sessionId}/generate-title`);
  },
  uploadFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    return api.post<Attachment>("/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
  },
  executeTool(name: string, args: Record<string, unknown>) {
    return api.post<{ result: string }>("/tools/execute", { name, arguments: args }, { timeout: 30000 });
  },
};
