<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ToolCallRecord } from "@/types/chat";

const props = defineProps<{ toolCall: ToolCallRecord }>();

const isActive = ["pending", "awaiting_confirmation", "executing"].includes(props.toolCall.status);
const expanded = ref(isActive);

watch(
  () => props.toolCall.status,
  (status) => {
    if (status === "completed" || status === "rejected") expanded.value = false;
    if (status === "awaiting_confirmation" || status === "executing") expanded.value = true;
  },
);

const statusLabel = computed(() => {
  switch (props.toolCall.status) {
    case "completed": return "Done";
    case "error": return "Error";
    case "pending": return "Running";
    case "executing": return "Executing...";
    case "awaiting_confirmation": return "Awaiting confirmation";
    case "confirmed": return "Approved";
    case "rejected": return "Rejected";
    default: return props.toolCall.status;
  }
});

const isExecuting = computed(() => props.toolCall.status === "executing");

const hasArgs = computed(() => Object.keys(props.toolCall.arguments).length > 0);
const hasResult = computed(() => !!props.toolCall.result);
</script>

<template>
  <div class="tool-card" :class="'status-' + toolCall.status">
    <button class="tool-header" @click="expanded = !expanded">
      <svg
        class="toggle-chevron"
        :class="{ rotated: expanded }"
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
      <svg class="tool-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
      <span class="tool-name">{{ toolCall.name }}</span>
      <span class="status-dot" />
      <span class="status-text">{{ statusLabel }}</span>
    </button>
    <div v-if="isExecuting" class="progress-track">
      <div class="progress-bar" />
    </div>
    <div v-if="expanded" class="tool-body">
      <div v-if="hasArgs" class="tool-section">
        <span class="section-label">Arguments</span>
        <pre class="section-code">{{ JSON.stringify(toolCall.arguments, null, 2) }}</pre>
      </div>
      <div v-if="hasResult" class="tool-section">
        <span class="section-label">Result</span>
        <pre class="section-code">{{ toolCall.result }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-card {
  border-left: 2px solid var(--color-border-tool);
  padding-left: 12px;
  margin-bottom: 10px;
  transition: border-color 0.2s;
}

.tool-card.status-completed {
  border-left-color: #52c41a;
}

.tool-card.status-error {
  border-left-color: var(--color-danger);
}

.tool-card.status-pending {
  border-left-color: #faad14;
}

.tool-card.status-awaiting_confirmation {
  border-left-color: #faad14;
}

.tool-card.status-executing {
  border-left-color: #1677ff;
}

.tool-card.status-confirmed {
  border-left-color: #52c41a;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  color: var(--color-text-muted);
  font-size: 13px;
  width: 100%;
  text-align: left;
  transition: color 0.2s;
}

.tool-header:hover {
  color: var(--color-text-primary);
}

.toggle-chevron {
  flex-shrink: 0;
  transition: transform 0.2s;
}

.toggle-chevron.rotated {
  transform: rotate(90deg);
}

.tool-icon {
  flex-shrink: 0;
  opacity: 0.6;
}

.tool-name {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-left: 4px;
}

.status-completed .status-dot {
  background: #52c41a;
}

.status-error .status-dot {
  background: var(--color-danger);
}

.status-pending .status-dot,
.status-awaiting_confirmation .status-dot {
  background: #faad14;
  animation: pulse-dot 1.5s infinite;
}

.status-executing .status-dot {
  background: #1677ff;
  animation: pulse-dot 1.5s infinite;
}

.status-confirmed .status-dot {
  background: #52c41a;
}

.status-rejected .status-dot {
  background: var(--color-danger);
}

@keyframes pulse-dot {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.status-text {
  font-size: 12px;
  color: var(--color-text-hint);
}

.progress-track {
  height: 3px;
  background: rgba(22, 119, 255, 0.12);
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 40%;
  border-radius: 2px;
  background: linear-gradient(90deg, #1677ff, #69b1ff);
  animation: progress-slide 1.5s ease-in-out infinite;
}

@keyframes progress-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}

.tool-body {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tool-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-hint);
}

.section-code {
  background: var(--color-bg-code);
  border-radius: 6px;
  padding: 8px 10px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}
</style>
