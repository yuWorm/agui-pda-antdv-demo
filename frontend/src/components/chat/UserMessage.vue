<script setup lang="ts">
defineProps<{ content: string }>();
</script>

<template>
  <div class="user-message">
    <div class="user-bubble">{{ content }}</div>
  </div>
</template>

<style scoped>
.user-message {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.user-bubble {
  max-width: 70%;
  padding: 12px 16px;
  background: #1677ff;
  color: #fff;
  border-radius: 16px 16px 4px 16px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
