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
      <a-tag color="orange">Confirmation Required</a-tag>
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
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.hil-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.hil-body {
  margin-bottom: 12px;
}

.hil-body code {
  display: block;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
}

.hil-actions {
  display: flex;
  gap: 8px;
}
</style>
