import { defineStore } from "pinia";
import { ref } from "vue";
import type { Message, Session, StreamingStatus } from "@/types/chat";

export const useChatStore = defineStore("chat", () => {
  const sessions = ref<Session[]>([]);
  const currentSessionId = ref<string | null>(null);
  const messages = ref<Message[]>([]);
  const streamingStatus = ref<StreamingStatus>("idle");
  const streamingContent = ref("");
  const sharedState = ref<Record<string, unknown>>({});

  function setSessions(list: Session[]) {
    sessions.value = list;
  }

  function addSession(session: Session) {
    sessions.value.unshift(session);
  }

  function removeSession(id: string) {
    sessions.value = sessions.value.filter((s) => s.id !== id);
  }

  function setCurrentSession(id: string | null) {
    currentSessionId.value = id;
  }

  function setMessages(list: Message[]) {
    messages.value = list;
  }

  function addMessage(msg: Message) {
    messages.value.push(msg);
  }

  function updateLastAssistantContent(content: string) {
    streamingContent.value = content;
  }

  function finalizeAssistantMessage(content: string, meta?: Partial<Message>) {
    const msg: Message = {
      id: crypto.randomUUID(),
      session_id: currentSessionId.value || "",
      role: "assistant",
      content,
      tool_calls: meta?.tool_calls ?? null,
      metadata_: meta?.metadata_ ?? null,
      ordering: messages.value.length + 1,
      created_at: new Date().toISOString(),
    };
    messages.value.push(msg);
    streamingContent.value = "";
    streamingStatus.value = "idle";
  }

  function setStreamingStatus(status: StreamingStatus) {
    streamingStatus.value = status;
  }

  function updateSharedState(state: Record<string, unknown>) {
    sharedState.value = state;
  }

  function mergeSharedState(delta: Record<string, unknown>) {
    sharedState.value = { ...sharedState.value, ...delta };
  }

  return {
    sessions, currentSessionId, messages, streamingStatus, streamingContent, sharedState,
    setSessions, addSession, removeSession, setCurrentSession,
    setMessages, addMessage, updateLastAssistantContent, finalizeAssistantMessage,
    setStreamingStatus, updateSharedState, mergeSharedState,
  };
});
