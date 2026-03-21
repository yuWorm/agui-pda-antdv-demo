<script setup lang="ts">
import ChatRenderer from "@/components/chat/ChatRenderer.vue";
import { useChatStore } from "@/stores/chat";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const chatStore = useChatStore();
</script>

<template>
  <a-drawer
    title="AI Assistant"
    placement="right"
    :open="open"
    :width="480"
    :body-style="{ padding: 0, height: '100%' }"
    @close="emit('close')"
  >
    <ChatRenderer :session-id="chatStore.currentSessionId" />
  </a-drawer>
</template>
