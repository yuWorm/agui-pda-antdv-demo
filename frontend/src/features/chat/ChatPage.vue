<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import ChatRenderer from "@/components/chat/ChatRenderer.vue";
import SessionList from "@/components/common/SessionList.vue";
import { useAuth } from "@/composables/useAuth";
import { useSessions } from "@/composables/useSessions";
import { useChatStore } from "@/stores/chat";

const route = useRoute();
const chatStore = useChatStore();
const { loadSessions } = useSessions();
const { fetchUser } = useAuth();

const sessionId = computed(() => (route.params.sessionId as string) || null);

onMounted(async () => {
  await fetchUser();
  await loadSessions();
  if (sessionId.value) {
    chatStore.setCurrentSession(sessionId.value);
  }
});
</script>

<template>
  <div class="chat-page">
    <aside class="sidebar">
      <SessionList />
    </aside>
    <main class="main-area">
      <ChatRenderer :session-id="sessionId" />
    </main>
  </div>
</template>

<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-area {
  flex: 1;
  overflow: hidden;
  background: var(--color-bg);
}
</style>
