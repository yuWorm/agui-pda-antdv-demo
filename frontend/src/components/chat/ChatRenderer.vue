<script setup lang="ts">
import { watch } from "vue";
import ChatInput from "./ChatInput.vue";
import MessageList from "./MessageList.vue";
import { useChat } from "@/composables/useChat";
import { useChatStore } from "@/stores/chat";

const props = withDefaults(defineProps<{ sessionId: string | null; embedded?: boolean }>(), {
  embedded: false,
});
const chatStore = useChatStore();
const { messages, streamingContent, streamingReasoning, isStreaming, isBusy, pendingToolCalls, resolveConfirmation, loadMessages, send, stop } = useChat({ navigate: !props.embedded });

if (props.embedded && !chatStore.currentSessionId) {
  const draftId = crypto.randomUUID();
  chatStore.setMessages([]);
  chatStore.setDraftSession(draftId);
}

watch(
  () => props.sessionId,
  async (id) => {
    if (chatStore.skipMessageReload) {
      chatStore.skipMessageReload = false;
      return;
    }
    if (id && !chatStore.isDraft(id)) await loadMessages(id);
  },
  { immediate: true },
);
</script>

<template>
  <div class="chat-renderer">
    <template v-if="messages.length === 0">
      <div class="welcome-state">
        <div class="welcome-content">
          <h1 class="welcome-title">AG-UI Assistant</h1>
          <p class="welcome-subtitle">What can I help you with?</p>
        </div>
      </div>
      <ChatInput :disabled="isBusy" @send="send" @stop="stop" />
    </template>
    <template v-else>
      <MessageList
        :messages="messages"
        :streaming-content="streamingContent"
        :streaming-reasoning="streamingReasoning"
        :is-streaming="isStreaming"
        :pending-confirmations="pendingToolCalls.filter((t) => t.status === 'awaiting_confirmation')"
        :executing-tool-calls="pendingToolCalls.filter((t) => t.status === 'executing' || t.status === 'completed' || t.status === 'error')"
        @confirm-tool="(id: string) => resolveConfirmation(id, true)"
        @reject-tool="(id: string) => resolveConfirmation(id, false)"
      />
      <ChatInput :disabled="isBusy" @send="send" @stop="stop" />
    </template>
  </div>
</template>

<style scoped>
.chat-renderer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg);
}

.welcome-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-content {
  text-align: center;
  max-width: 480px;
  padding: 0 24px;
}

.welcome-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px;
  letter-spacing: -0.5px;
}

.welcome-subtitle {
  font-size: 15px;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.6;
}
</style>
