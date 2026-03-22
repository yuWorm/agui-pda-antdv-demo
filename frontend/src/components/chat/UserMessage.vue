<script setup lang="ts">
import AttachmentPreview from "./AttachmentPreview.vue";
import type { Attachment } from "@/types/chat";

defineProps<{
  content: string;
  attachments?: Attachment[] | null;
}>();
</script>

<template>
  <div class="user-message">
    <div class="user-bubble">
      <AttachmentPreview
        v-if="attachments?.length"
        :attachments="attachments"
        class="user-attachments"
      />
      <div v-if="content" class="user-content">{{ content }}</div>
    </div>
  </div>
</template>

<style scoped>
.user-message {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
}

.user-bubble {
  max-width: 85%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-attachments {
  justify-content: flex-end;
}

.user-attachments :deep(.attachment-thumb) {
  width: 120px;
  height: 120px;
  border-radius: 12px;
}

.user-content {
  padding: 12px 16px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 16px 16px 4px 16px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 15px;
  line-height: 1.6;
}
</style>
