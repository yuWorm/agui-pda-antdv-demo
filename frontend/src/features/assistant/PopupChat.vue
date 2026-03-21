<script setup lang="ts">
import { onMounted } from "vue";
import ChatRenderer from "@/components/chat/ChatRenderer.vue";
import { useSessions } from "@/composables/useSessions";
import { useChatStore } from "@/stores/chat";

const emit = defineEmits<{
  close: [];
  expand: [];
}>();

const chatStore = useChatStore();
const { createSession } = useSessions();

onMounted(async () => {
  if (!chatStore.currentSessionId) {
    await createSession("Quick Chat");
  }
});
</script>

<template>
  <div class="popup-chat">
    <div class="popup-header">
      <span>AI Assistant</span>
      <div class="popup-actions">
        <a-button type="text" size="small" @click="emit('expand')">Expand</a-button>
        <a-button type="text" size="small" @click="emit('close')">&times;</a-button>
      </div>
    </div>
    <div class="popup-body">
      <ChatRenderer :session-id="chatStore.currentSessionId" />
    </div>
  </div>
</template>

<style scoped>
.popup-chat {
  position: fixed;
  right: 24px;
  bottom: 80px;
  width: 380px;
  height: 520px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
}

.popup-actions {
  display: flex;
  gap: 4px;
}

.popup-body {
  flex: 1;
  overflow: hidden;
}
</style>
