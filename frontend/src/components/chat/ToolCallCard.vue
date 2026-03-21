<script setup lang="ts">
import type { ToolCallRecord } from "@/types/chat";

defineProps<{ toolCall: ToolCallRecord }>();
</script>

<template>
  <div class="tool-call-card">
    <div class="tool-header">
      <a-tag color="blue">{{ toolCall.name }}</a-tag>
      <a-tag v-if="toolCall.status === 'completed'" color="green">Done</a-tag>
      <a-tag v-else-if="toolCall.status === 'error'" color="red">Error</a-tag>
      <a-tag v-else-if="toolCall.status === 'pending'" color="orange">Pending</a-tag>
    </div>
    <div v-if="Object.keys(toolCall.arguments).length" class="tool-args">
      <code>{{ JSON.stringify(toolCall.arguments, null, 2) }}</code>
    </div>
    <div v-if="toolCall.result" class="tool-result">
      <span class="result-label">Result:</span>
      <code>{{ toolCall.result }}</code>
    </div>
  </div>
</template>

<style scoped>
.tool-call-card {
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  font-size: 13px;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.tool-args, .tool-result {
  background: #f0f0f0;
  border-radius: 4px;
  padding: 6px 8px;
  margin-top: 4px;
  overflow-x: auto;
}

.result-label {
  font-weight: 600;
  margin-right: 4px;
}
</style>
