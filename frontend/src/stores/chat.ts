import { defineStore } from "pinia";
import { ref } from "vue";
import type { Message, Session, StreamingStatus } from "@/types/chat";

export const useChatStore = defineStore("chat", () => {
  const sessions = ref<Session[]>([]);
  const currentSessionId = ref<string | null>(null);
  const draftSessionId = ref<string | null>(null);
  const messages = ref<Message[]>([]);
  const streamingStatus = ref<StreamingStatus>("idle");
  const streamingContent = ref("");
  const streamingReasoning = ref("");
  const sharedState = ref<Record<string, unknown>>({});
  const skipMessageReload = ref(false);

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
    if (id && id !== draftSessionId.value) {
      draftSessionId.value = null;
    }
  }

  function setDraftSession(id: string) {
    draftSessionId.value = id;
    currentSessionId.value = id;
  }

  function isDraft(id?: string | null): boolean {
    const checkId = id ?? currentSessionId.value;
    return checkId !== null && checkId === draftSessionId.value;
  }

  function promoteDraft(realId: string) {
    draftSessionId.value = null;
    currentSessionId.value = realId;
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

  function updateStreamingReasoning(content: string) {
    streamingReasoning.value = content;
  }

  function finalizeAssistantMessage(content: string, meta?: Partial<Message>) {
    commitAssistantMessage(content, meta);
    streamingStatus.value = "idle";
  }

  function commitAssistantMessage(content: string, meta?: Partial<Message>) {
    const msg: Message = {
      id: crypto.randomUUID(),
      session_id: currentSessionId.value || "",
      role: "assistant",
      content,
      reasoning: meta?.reasoning ?? (streamingReasoning.value || null),
      tool_calls: meta?.tool_calls ?? null,
      metadata_: meta?.metadata_ ?? null,
      ordering: messages.value.length + 1,
      created_at: new Date().toISOString(),
    };
    messages.value.push(msg);
    streamingContent.value = "";
    streamingReasoning.value = "";
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
    sessions, currentSessionId, draftSessionId, messages, streamingStatus, streamingContent, streamingReasoning, sharedState, skipMessageReload,
    setSessions, addSession, removeSession, setCurrentSession,
    setDraftSession, isDraft, promoteDraft,
    setMessages, addMessage, updateLastAssistantContent, updateStreamingReasoning, finalizeAssistantMessage, commitAssistantMessage,
    setStreamingStatus, updateSharedState, mergeSharedState,
  };
});
