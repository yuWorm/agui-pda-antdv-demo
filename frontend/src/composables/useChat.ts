import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAgui } from "./useAgui";
import { chatApi } from "@/services/chat";
import { useChatStore } from "@/stores/chat";
import { useSettingsStore } from "@/stores/settings";
import type { Attachment } from "@/types/chat";
import api from "@/services/api";

export function useChat(options?: { navigate?: boolean }) {
  const shouldNavigate = options?.navigate ?? true;
  const store = useChatStore();
  const settingsStore = useSettingsStore();
  const router = useRouter();
  const { sendMessage: aguiSend, abortRun, pendingToolCalls, resolveConfirmation } = useAgui();

  const sending = ref(false);
  const isStreaming = computed(() => store.streamingStatus === "streaming");
  const isConfirming = computed(() => store.streamingStatus === "confirming");
  const isExecuting = computed(() => store.streamingStatus === "executing");

  async function loadMessages(sessionId: string) {
    const { data } = await chatApi.getMessages(sessionId);
    store.setMessages(data);
  }

  async function ensureSession(firstMessage: string): Promise<string> {
    if (store.currentSessionId && !store.isDraft()) {
      return store.currentSessionId;
    }

    const initialTitle = firstMessage.slice(0, 30) + (firstMessage.length > 30 ? "..." : "");
    const { data } = await chatApi.createSession({
      title: initialTitle,
      model_provider: settingsStore.modelProvider,
      model_name: settingsStore.modelName,
    });
    store.addSession(data);
    store.promoteDraft(data.id);
    store.skipMessageReload = true;
    if (shouldNavigate) await router.replace(`/chat/${data.id}`);
    return data.id;
  }

  async function send(payload: { content: string; attachments?: Attachment[] }) {
    const { content, attachments } = payload;
    if (!content.trim() && !attachments?.length) return;
    if (sending.value) return;
    sending.value = true;

    try {
    const isFirstMessage = store.messages.length === 0;
    const sessionId = await ensureSession(content || "(attachment)");

    const userMsg = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      role: "user" as const,
      content,
      tool_calls: null,
      attachments: attachments?.length ? attachments : null,
      metadata_: null,
      ordering: store.messages.length + 1,
      created_at: new Date().toISOString(),
    };
    store.addMessage(userMsg);

    await api
      .post(`/chat/sessions/${sessionId}/messages`, {
        role: "user",
        content,
        attachments: attachments?.length ? attachments : null,
      })
      .catch((err: unknown) =>
        console.warn("Failed to persist user message:", err),
      );

    const history = store.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const msgCountBefore = store.messages.length;
    await aguiSend(content, sessionId, history);

    const newAssistantMsgs = store.messages
      .slice(msgCountBefore)
      .filter((m) => m.role === "assistant");

    for (const msg of newAssistantMsgs) {
      await api
        .post(`/chat/sessions/${sessionId}/messages`, {
          role: "assistant",
          content: msg.content,
          tool_calls: msg.tool_calls,
        })
        .catch((err: unknown) =>
          console.warn("Failed to persist assistant message:", err),
        );
    }

    if (isFirstMessage && newAssistantMsgs.length > 0) {
      chatApi
        .generateTitle(sessionId)
        .then(({ data }) => {
          const session = store.sessions.find((s) => s.id === sessionId);
          if (session) session.title = data.title;
        })
        .catch((err: unknown) =>
          console.warn("Failed to generate title:", err),
        );
    }
    } finally {
      sending.value = false;
    }
  }

  function stop() {
    abortRun();
  }

  const isBusy = computed(() => sending.value || isStreaming.value || isConfirming.value || isExecuting.value);

  return {
    messages: computed(() => store.messages),
    streamingContent: computed(() => store.streamingContent),
    streamingReasoning: computed(() => store.streamingReasoning),
    streamingStatus: computed(() => store.streamingStatus),
    isStreaming,
    isConfirming,
    isExecuting,
    isBusy,
    pendingToolCalls,
    resolveConfirmation,
    loadMessages,
    send,
    stop,
  };
}
