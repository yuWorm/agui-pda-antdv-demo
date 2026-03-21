<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import AssistantMessage from "./AssistantMessage.vue";
import HilConfirm from "./HilConfirm.vue";
import UserMessage from "./UserMessage.vue";
import type { Message, ToolCallRecord } from "@/types/chat";

const props = defineProps<{
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  pendingConfirmations: ToolCallRecord[];
}>();

const emit = defineEmits<{
  confirmTool: [id: string];
  rejectTool: [id: string];
}>();

const listRef = ref<HTMLDivElement>();

watch(
  () => [props.messages.length, props.streamingContent],
  () => nextTick(() => listRef.value?.scrollTo({ top: listRef.value.scrollHeight, behavior: "smooth" })),
);
</script>

<template>
  <div ref="listRef" class="message-list">
    <template v-for="msg in messages" :key="msg.id">
      <UserMessage v-if="msg.role === 'user'" :content="msg.content" />
      <AssistantMessage v-else-if="msg.role === 'assistant'" :content="msg.content" :tool-calls="msg.tool_calls" />
    </template>
    <HilConfirm
      v-for="tc in pendingConfirmations"
      :key="tc.id"
      :tool-call="tc"
      @confirm="emit('confirmTool', tc.id)"
      @reject="emit('rejectTool', tc.id)"
    />
    <AssistantMessage v-if="isStreaming && streamingContent" :content="streamingContent" :streaming="true" />
    <div v-if="isStreaming && !streamingContent" class="thinking">
      <a-spin size="small" /> <span>Thinking...</span>
    </div>
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.thinking {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  color: #999;
}
</style>
