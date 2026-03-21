<script setup lang="ts">
import { ref } from "vue";

defineProps<{ disabled?: boolean }>();
const emit = defineEmits<{
  send: [content: string];
  stop: [];
}>();

const input = ref("");

function handleSend() {
  const content = input.value.trim();
  if (!content) return;
  emit("send", content);
  input.value = "";
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}
</script>

<template>
  <div class="chat-input">
    <a-textarea
      v-model:value="input"
      :auto-size="{ minRows: 1, maxRows: 6 }"
      placeholder="Type a message... (Shift+Enter for new line)"
      @keydown="handleKeydown"
    />
    <a-button v-if="!disabled" type="primary" @click="handleSend" :disabled="!input.trim()">
      Send
    </a-button>
    <a-button v-else danger @click="emit('stop')">
      Stop
    </a-button>
  </div>
</template>

<style scoped>
.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
  align-items: flex-end;
}

.chat-input :deep(.ant-input) {
  border-radius: 20px;
  padding: 8px 16px;
}
</style>
