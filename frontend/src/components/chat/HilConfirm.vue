<script setup lang="ts">
import type { ToolCallRecord } from "@/types/chat";

const props = defineProps<{ toolCall: ToolCallRecord }>();
const emit = defineEmits<{
  confirm: [id: string];
  reject: [id: string];
}>();
</script>

<template>
  <div class="hil-confirm">
    <div class="hil-header">
      <a-tag color="warning">Confirmation Required</a-tag>
      <strong>{{ props.toolCall.name }}</strong>
    </div>
    <div class="hil-body">
      <p>The agent wants to execute this tool. Do you approve?</p>
      <code>{{ JSON.stringify(props.toolCall.arguments, null, 2) }}</code>
    </div>
    <div class="hil-actions">
      <a-button type="primary" size="small" @click="emit('confirm', props.toolCall.id)">
        Approve
      </a-button>
      <a-button danger size="small" @click="emit('reject', props.toolCall.id)">
        Reject
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.hil-confirm {
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
}

.hil-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.hil-body {
  margin-bottom: 12px;
}

.hil-body p {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.hil-body code {
  display: block;
  background: var(--color-bg-code);
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--color-text-secondary);
}

.hil-actions {
  display: flex;
  gap: 8px;
}
</style>
