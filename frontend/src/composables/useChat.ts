import { computed } from "vue";
import { useAgui } from "./useAgui";
import { chatApi } from "@/services/chat";
import { useChatStore } from "@/stores/chat";
import api from "@/services/api";

export function useChat() {
  const store = useChatStore();
  const { sendMessage: aguiSend, abortRun, pendingToolCalls } = useAgui();

  const isStreaming = computed(() => store.streamingStatus === "streaming");

  async function loadMessages(sessionId: string) {
    const { data } = await chatApi.getMessages(sessionId);
    store.setMessages(data);
  }

  async function send(content: string) {
    if (!store.currentSessionId || !content.trim()) return;

    const userMsg = {
      id: crypto.randomUUID(),
      session_id: store.currentSessionId,
      role: "user" as const,
      content,
      tool_calls: null,
      metadata_: null,
      ordering: store.messages.length + 1,
      created_at: new Date().toISOString(),
    };
    store.addMessage(userMsg);

    await api
      .post(`/chat/sessions/${store.currentSessionId}/messages`, {
        role: "user",
        content,
      })
      .catch((err: unknown) =>
        console.warn("Failed to persist user message:", err),
      );

    const history = store.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await aguiSend(content, store.currentSessionId, history);

    const lastMsg = store.messages[store.messages.length - 1];
    if (lastMsg?.role === "assistant") {
      await api
        .post(`/chat/sessions/${store.currentSessionId}/messages`, {
          role: "assistant",
          content: lastMsg.content,
          tool_calls: lastMsg.tool_calls,
        })
        .catch((err: unknown) =>
          console.warn("Failed to persist assistant message:", err),
        );
    }
  }

  function stop() {
    abortRun();
  }

  return {
    messages: computed(() => store.messages),
    streamingContent: computed(() => store.streamingContent),
    streamingStatus: computed(() => store.streamingStatus),
    isStreaming,
    pendingToolCalls,
    loadMessages,
    send,
    stop,
  };
}
