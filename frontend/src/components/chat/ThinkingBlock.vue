<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  content: string;
  streaming?: boolean;
}>();

const expanded = ref(true);
</script>

<template>
  <div class="thinking-block" :class="{ collapsed: !expanded }">
    <button class="thinking-toggle" @click="expanded = !expanded">
      <svg
        class="toggle-icon"
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
      <span class="thinking-label">
        <template v-if="streaming">
          <span class="thinking-indicator" />
          Thinking...
        </template>
        <template v-else>Thought</template>
      </span>
    </button>
    <div v-show="expanded" class="thinking-content">
      <pre class="thinking-text">{{ content }}</pre>
    </div>
  </div>
</template>

<style scoped>
.thinking-block {
  margin-bottom: 12px;
  border-left: 2px solid var(--color-border-secondary);
  padding-left: 12px;
}

.thinking-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 13px;
  padding: 4px 0;
  transition: color 0.2s;
}

.thinking-toggle:hover {
  color: var(--color-text-tertiary);
}

.toggle-icon {
  transition: transform 0.2s;
}

.toggle-icon.rotated {
  transform: rotate(90deg);
}

.thinking-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.thinking-indicator {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.thinking-content {
  margin-top: 6px;
  max-height: 300px;
  overflow-y: auto;
}

.thinking-text {
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-muted);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}
</style>
