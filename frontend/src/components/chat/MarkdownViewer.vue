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
}

.markdown-viewer :deep(pre) {
  border-radius: 8px;
  overflow-x: auto;
}

.markdown-viewer :deep(table) {
  border-collapse: collapse;
  width: 100%;
}

.markdown-viewer :deep(th),
.markdown-viewer :deep(td) {
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
}
</style>
