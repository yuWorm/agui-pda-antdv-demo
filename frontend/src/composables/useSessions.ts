import { useRouter } from "vue-router";
import { chatApi } from "@/services/chat";
import { useChatStore } from "@/stores/chat";
import { useSettingsStore } from "@/stores/settings";

export function useSessions() {
  const chatStore = useChatStore();
  const settingsStore = useSettingsStore();
  const router = useRouter();

  async function loadSessions() {
    const { data } = await chatApi.listSessions();
    chatStore.setSessions(data);
  }

  async function createSession(title?: string) {
    const { data } = await chatApi.createSession({
      title: title || "New Chat",
      model_provider: settingsStore.modelProvider,
      model_name: settingsStore.modelName,
    });
    chatStore.addSession(data);
    chatStore.setCurrentSession(data.id);
    chatStore.setMessages([]);
    await router.push(`/chat/${data.id}`);
  }

  async function selectSession(sessionId: string) {
    chatStore.setCurrentSession(sessionId);
    await router.push(`/chat/${sessionId}`);
  }

  async function deleteSession(sessionId: string) {
    await chatApi.deleteSession(sessionId);
    chatStore.removeSession(sessionId);
    if (chatStore.currentSessionId === sessionId) {
      chatStore.setCurrentSession(null);
      chatStore.setMessages([]);
      await router.push("/chat");
    }
  }

  async function renameSession(sessionId: string, title: string) {
    await chatApi.updateSession(sessionId, { title });
    await loadSessions();
  }

  return {
    sessions: chatStore.sessions,
    loadSessions,
    createSession,
    selectSession,
    deleteSession,
    renameSession,
  };
}
