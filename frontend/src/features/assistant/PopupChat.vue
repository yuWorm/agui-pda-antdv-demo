<script setup lang="ts">
import { onMounted, ref } from "vue";
import ChatRenderer from "@/components/chat/ChatRenderer.vue";
import SessionDialog from "@/components/chat/SessionDialog.vue";
import { useSessions } from "@/composables/useSessions";
import { useChatStore } from "@/stores/chat";

const emit = defineEmits<{
  close: [];
  expand: [];
}>();

const chatStore = useChatStore();
const { createSession, loadSessions } = useSessions({ navigate: false });
const showSessions = ref(false);

onMounted(async () => {
  await loadSessions();
  if (!chatStore.currentSessionId) {
    await createSession();
  }
});
</script>

<template>
  <div class="popup-chat">
    <div class="popup-header">
      <span class="popup-title">AI Assistant</span>
      <div class="popup-actions">
        <button class="popup-action" title="Sessions" @click="showSessions = true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
        <button class="popup-action" title="Expand" @click="emit('expand')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
        <button class="popup-action" title="Close" @click="emit('close')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
    <div class="popup-body">
      <ChatRenderer :session-id="chatStore.currentSessionId" embedded />
    </div>
    <SessionDialog v-model:open="showSessions" />
  </div>
</template>

<style scoped>
.popup-chat {
  position: fixed;
  right: 24px;
  bottom: 80px;
  width: 400px;
  height: 560px;
  background: var(--color-bg-elevated);
  border-radius: 16px;
  box-shadow: var(--shadow-popup);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  border: 1px solid var(--color-border);
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
}

.popup-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--color-text-primary);
}

.popup-actions {
  display: flex;
  gap: 4px;
}

.popup-action {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: all 0.2s;
}

.popup-action:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.popup-body {
  flex: 1;
  overflow: hidden;
}
</style>
