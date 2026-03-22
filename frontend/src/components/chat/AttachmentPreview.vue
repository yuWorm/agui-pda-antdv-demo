<script setup lang="ts">
import type { Attachment } from "@/types/chat";

export interface PendingFile {
  file: File;
  previewUrl?: string;
}

defineProps<{
  /** Files pending upload (used in ChatInput before send) */
  pendingFiles?: PendingFile[];
  /** Already-uploaded attachments (used in message display) */
  attachments?: Attachment[];
  removable?: boolean;
}>();

const emit = defineEmits<{
  remove: [index: number];
}>();

function isImage(mime: string) {
  return mime.startsWith("image/");
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>

<template>
  <div v-if="(pendingFiles?.length || attachments?.length)" class="attachment-strip">
    <!-- Pending files (before upload) -->
    <div v-for="(pf, idx) in pendingFiles" :key="'p-' + idx" class="attachment-item">
      <img
        v-if="isImage(pf.file.type) && pf.previewUrl"
        :src="pf.previewUrl"
        class="attachment-thumb"
        alt=""
      />
      <div v-else class="attachment-file-icon">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <div class="attachment-info">
        <span class="attachment-name">{{ pf.file.name }}</span>
        <span class="attachment-size">{{ formatSize(pf.file.size) }}</span>
      </div>
      <button v-if="removable" class="attachment-remove" @click="emit('remove', idx)">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Uploaded attachments (in messages) -->
    <template v-for="att in attachments" :key="'a-' + att.id">
      <a
        v-if="isImage(att.mime_type)"
        :href="att.url"
        target="_blank"
        class="attachment-item attachment-item--link"
      >
        <img :src="att.url" class="attachment-thumb" :alt="att.filename" />
      </a>
      <a
        v-else
        :href="att.url"
        target="_blank"
        class="attachment-item attachment-item--link"
      >
        <div class="attachment-file-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div class="attachment-info">
          <span class="attachment-name">{{ att.filename }}</span>
          <span class="attachment-size">{{ formatSize(att.size) }}</span>
        </div>
      </a>
    </template>
  </div>
</template>

<style scoped>
.attachment-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attachment-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: 10px;
  padding: 6px 10px;
  max-width: 220px;
  overflow: hidden;
}

.attachment-item--link {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.2s;
}

.attachment-item--link:hover {
  border-color: var(--color-primary);
}

.attachment-thumb {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.attachment-file-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: var(--color-bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.attachment-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.attachment-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attachment-size {
  font-size: 11px;
  color: var(--color-text-muted);
}

.attachment-remove {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--color-border-secondary);
  background: var(--color-bg);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.attachment-remove:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-color: var(--color-danger);
}
</style>
