<script setup lang="ts">
import { ref } from "vue";
import AttachmentPreview from "./AttachmentPreview.vue";
import type { PendingFile } from "./AttachmentPreview.vue";
import type { Attachment } from "@/types/chat";
import { chatApi } from "@/services/chat";

const props = defineProps<{ disabled?: boolean }>();
const emit = defineEmits<{
  send: [payload: { content: string; attachments: Attachment[] }];
  stop: [];
}>();

const input = ref("");
const pendingFiles = ref<PendingFile[]>([]);
const uploading = ref(false);
const fileInputRef = ref<HTMLInputElement>();

function addFiles(files: FileList | File[]) {
  for (const file of files) {
    const pf: PendingFile = { file };
    if (file.type.startsWith("image/")) {
      pf.previewUrl = URL.createObjectURL(file);
    }
    pendingFiles.value.push(pf);
  }
}

function removeFile(index: number) {
  const [removed] = pendingFiles.value.splice(index, 1);
  if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files?.length) {
    addFiles(target.files);
    target.value = "";
  }
}

function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items;
  if (!items) return;
  const imageFiles: File[] = [];
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) imageFiles.push(file);
    }
  }
  if (imageFiles.length) {
    e.preventDefault();
    addFiles(imageFiles);
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer?.files?.length) {
    addFiles(e.dataTransfer.files);
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
}

async function handleSend() {
  if (props.disabled || uploading.value) return;
  const content = input.value.trim();
  if (!content && !pendingFiles.value.length) return;

  let attachments: Attachment[] = [];
  if (pendingFiles.value.length) {
    uploading.value = true;
    try {
      const results = await Promise.all(
        pendingFiles.value.map((pf) => chatApi.uploadFile(pf.file)),
      );
      attachments = results.map((r) => r.data);
    } catch (err) {
      console.error("Upload failed:", err);
      uploading.value = false;
      return;
    }
    uploading.value = false;
  }

  pendingFiles.value.forEach((pf) => {
    if (pf.previewUrl) URL.revokeObjectURL(pf.previewUrl);
  });
  pendingFiles.value = [];

  emit("send", { content, attachments });
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
  <div class="chat-input-wrapper">
    <div
      class="chat-input-card"
      @drop="handleDrop"
      @dragover="handleDragOver"
    >
      <AttachmentPreview
        v-if="pendingFiles.length"
        :pending-files="pendingFiles"
        :removable="true"
        class="input-attachments"
        @remove="removeFile"
      />
      <a-textarea
        v-model:value="input"
        :auto-size="{ minRows: 1, maxRows: 6 }"
        variant="borderless"
        placeholder="Type a message..."
        class="input-textarea"
        @keydown="handleKeydown"
        @paste="handlePaste"
      />
      <div class="input-footer">
        <div class="input-actions-left">
          <button class="action-btn" title="Upload file" @click="fileInputRef?.click()">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            ref="fileInputRef"
            type="file"
            multiple
            class="file-input-hidden"
            accept="image/*,.pdf,.txt,.csv,.md,.json,.doc,.docx,.xls,.xlsx"
            @change="handleFileSelect"
          />
          <span class="input-hint">
            <kbd>Enter</kbd> send, <kbd>Shift+Enter</kbd> newline
          </span>
        </div>
        <div class="input-actions-right">
          <span v-if="uploading" class="upload-indicator">Uploading...</span>
          <button
            v-if="!disabled"
            class="send-btn"
            :class="{ active: input.trim() || pendingFiles.length }"
            :disabled="(!input.trim() && !pendingFiles.length) || uploading"
            @click="handleSend"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
          <button v-else class="stop-btn" @click="emit('stop')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-input-wrapper {
  padding: 0 24px 20px;
  background: var(--color-bg);
}

.chat-input-card {
  max-width: 720px;
  margin: 0 auto;
  border: 1px solid var(--color-border-secondary);
  border-radius: 16px;
  padding: 12px 16px 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: var(--color-bg-input);
}

.chat-input-card:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}

.input-attachments {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-secondary);
  margin-bottom: 8px;
}

.input-textarea {
  font-size: 15px;
  line-height: 1.6;
  resize: none;
}

.input-textarea :deep(.ant-input) {
  padding: 0;
  font-size: 15px;
  background: transparent;
  color: var(--color-text-primary);
}

.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
}

.input-actions-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.file-input-hidden {
  display: none;
}

.input-hint {
  font-size: 12px;
  color: var(--color-text-hint);
}

.input-hint kbd {
  background: var(--color-bg-kbd);
  border: 1px solid var(--color-border-kbd);
  border-radius: 3px;
  padding: 0 4px;
  font-size: 11px;
  font-family: inherit;
  color: var(--color-text-muted);
}

.input-actions-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-indicator {
  font-size: 12px;
  color: var(--color-primary);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--color-send-inactive);
  color: #fff;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn.active {
  background: var(--color-primary);
  cursor: pointer;
}

.send-btn.active:hover {
  background: var(--color-primary-hover);
}

.stop-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--color-danger);
  background: transparent;
  color: var(--color-danger);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.stop-btn:hover {
  background: var(--color-danger-bg);
}
</style>
