import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { chatApi } from "@/services/chat";
import { useChatStore } from "@/stores/chat";

export function useSessions(options?: { navigate?: boolean }) {
  const shouldNavigate = options?.navigate ?? true;
  const chatStore = useChatStore();
  const { sessions } = storeToRefs(chatStore);
  const router = useRouter();

  async function loadSessions() {
    const { data } = await chatApi.listSessions();
    chatStore.setSessions(data);
  }

  async function createSession() {
    const draftId = crypto.randomUUID();
    chatStore.setMessages([]);
    chatStore.setDraftSession(draftId);
    if (shouldNavigate) await router.push(`/chat/${draftId}`);
  }

  async function selectSession(sessionId: string) {
    chatStore.setCurrentSession(sessionId);
    if (shouldNavigate) await router.push(`/chat/${sessionId}`);
  }

  async function deleteSession(sessionId: string) {
    await chatApi.deleteSession(sessionId);
    chatStore.removeSession(sessionId);
    if (chatStore.currentSessionId === sessionId) {
      const remaining = chatStore.sessions;
      if (remaining.length > 0) {
        chatStore.setCurrentSession(remaining[0].id);
        if (shouldNavigate) await router.push(`/chat/${remaining[0].id}`);
      } else {
        await createSession();
      }
    }
  }

  async function renameSession(sessionId: string, title: string) {
    await chatApi.updateSession(sessionId, { title });
    await loadSessions();
  }

  return {
    sessions,
    loadSessions,
    createSession,
    selectSession,
    deleteSession,
    renameSession,
  };
}
