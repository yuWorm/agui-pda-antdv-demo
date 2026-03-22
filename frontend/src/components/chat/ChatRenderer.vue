<script setup lang="ts">
import { watch } from "vue";
import { ChatBox } from "@yuworm/agui-antdvn-chat";
import "@yuworm/agui-antdvn-chat/dist/index.css";
import type { Attachment, ChatError } from "@yuworm/agui-antdvn-chat";
import { useChat } from "@/composables/useChat";
import { useChatStore } from "@/stores/chat";
import { chatApi } from "@/services/chat";

const props = withDefaults(defineProps<{ sessionId: string | null; embedded?: boolean }>(), {
  embedded: false,
});
const chatStore = useChatStore();
const { messages, streamingContent, streamingReasoning, streamingStatus, isBusy, pendingToolCalls, resolveConfirmation, loadMessages, send, stop } = useChat({ navigate: !props.embedded });

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

async function handleUpload(file: File): Promise<Attachment> {
  const { data } = await chatApi.uploadFile(file);
  return data;
}

function handleError(error: ChatError) {
  console.error(`[ChatRenderer] ${error.type}:`, error.message, error.originalError);
}
</script>

<template>
  <ChatBox
    :messages="messages"
    :streaming-content="streamingContent"
    :streaming-reasoning="streamingReasoning"
    :streaming-status="streamingStatus"
    :pending-tool-calls="pendingToolCalls"
    :disabled="isBusy"
    :upload-handler="handleUpload"
    :on-error="handleError"
    @send="send"
    @stop="stop"
    @confirm-tool="(id: string) => resolveConfirmation(id, true)"
    @reject-tool="(id: string) => resolveConfirmation(id, false)"
  />
</template>
