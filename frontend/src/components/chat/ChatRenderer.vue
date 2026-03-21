<script setup lang="ts">
import { watch } from "vue";
import ChatInput from "./ChatInput.vue";
import MessageList from "./MessageList.vue";
import { useChat } from "@/composables/useChat";

const props = defineProps<{ sessionId: string | null }>();
const { messages, streamingContent, isStreaming, pendingToolCalls, loadMessages, send, stop } = useChat();

watch(
  () => props.sessionId,
  async (id) => {
    if (id) await loadMessages(id);
  },
  { immediate: true },
);

function handleConfirmTool(toolCallId: string) {
  const tc = pendingToolCalls.value.find((t) => t.id === toolCallId);
  if (tc) tc.status = "confirmed";
}

function handleRejectTool(toolCallId: string) {
  const tc = pendingToolCalls.value.find((t) => t.id === toolCallId);
  if (tc) tc.status = "rejected";
}
</script>

<template>
  <div class="chat-renderer">
    <div v-if="!sessionId" class="empty-state">
      <h2>Start a conversation</h2>
      <p>Create a new session or select one from the sidebar.</p>
    </div>
    <template v-else>
      <MessageList
        :messages="messages"
        :streaming-content="streamingContent"
        :is-streaming="isStreaming"
        :pending-confirmations="pendingToolCalls.filter((t) => t.status === 'pending')"
        @confirm-tool="handleConfirmTool"
        @reject-tool="handleRejectTool"
      />
      <ChatInput :disabled="isStreaming" @send="send" @stop="stop" />
    </template>
  </div>
</template>

<style scoped>
.chat-renderer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}
</style>
