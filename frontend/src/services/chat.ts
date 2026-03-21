import api from "./api";
import type { Message, Session } from "@/types/chat";

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
};
