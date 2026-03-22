<script setup lang="ts">
import MarkdownRender from "markstream-vue";

defineProps<{
  content: string;
  streaming?: boolean;
}>();
</script>

<template>
  <MarkdownRender :content="content" :final="!streaming" class="markdown-viewer" />
</template>

<style scoped>
.markdown-viewer {
  line-height: 1.7;
  word-wrap: break-word;
  color: var(--color-text-secondary);
}

.markdown-viewer :deep(p) {
  margin: 0 0 12px;
}

.markdown-viewer :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-viewer :deep(pre) {
  border-radius: 10px;
  overflow-x: auto;
  margin: 12px 0;
}

.markdown-viewer :deep(code:not(pre code)) {
  background: var(--color-bg-code);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.markdown-viewer :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.markdown-viewer :deep(th),
.markdown-viewer :deep(td) {
  border: 1px solid var(--color-border-table);
  padding: 8px 12px;
}

.markdown-viewer :deep(th) {
  background: var(--color-bg-secondary);
  font-weight: 600;
}

.markdown-viewer :deep(blockquote) {
  border-left: 3px solid var(--color-primary);
  padding-left: 12px;
  margin: 12px 0;
  color: var(--color-text-tertiary);
}

.markdown-viewer :deep(ul),
.markdown-viewer :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.markdown-viewer :deep(li) {
  margin-bottom: 4px;
}
</style>
