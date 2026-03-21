<script setup lang="ts">
import MarkdownViewer from "./MarkdownViewer.vue";
import ToolCallCard from "./ToolCallCard.vue";
import type { ToolCallRecord } from "@/types/chat";

defineProps<{
  content: string;
  streaming?: boolean;
  toolCalls?: ToolCallRecord[] | null;
}>();
</script>

<template>
  <div class="assistant-message">
    <div class="assistant-bubble">
      <ToolCallCard v-for="tc in toolCalls" :key="tc.id" :tool-call="tc" />
      <MarkdownViewer :content="content" :streaming="streaming" />
      <span v-if="streaming" class="cursor-blink" />
    </div>
  </div>
</template>

<style scoped>
.assistant-message {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
}

.assistant-bubble {
  max-width: 80%;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 16px 16px 16px 4px;
}

.cursor-blink {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: #333;
  margin-left: 2px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
