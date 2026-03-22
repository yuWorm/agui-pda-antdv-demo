<script setup lang="ts">
import { ref } from "vue";
import ChatRenderer from "@/components/chat/ChatRenderer.vue";
import SessionDialog from "@/components/chat/SessionDialog.vue";
import { useChatStore } from "@/stores/chat";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const chatStore = useChatStore();
const showSessions = ref(false);
</script>

<template>
  <a-drawer
    title="AI Assistant"
    placement="right"
    :open="open"
    size="large"
    :styles="{ body: { padding: 0, height: '100%' } }"
    @close="emit('close')"
  >
    <template #extra>
      <a-button size="small" @click="showSessions = true">Sessions</a-button>
    </template>
    <ChatRenderer :session-id="chatStore.currentSessionId" embedded />
    <SessionDialog v-model:open="showSessions" />
  </a-drawer>
</template>
