<script setup lang="ts">
import { useAuth } from "@/composables/useAuth";
import { useAuthStore } from "@/stores/auth";
import ModelSelector from "./ModelSelector.vue";

const authStore = useAuthStore();
const { logout } = useAuth();
</script>

<template>
  <div class="app-header">
    <div class="header-left">
      <h3>AG-UI Demo</h3>
    </div>
    <div class="header-right">
      <ModelSelector />
      <span class="username">{{ authStore.user?.display_name }}</span>
      <a-button type="text" size="small" @click="logout">Logout</a-button>
    </div>
  </div>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}

.header-left h3 {
  margin: 0;
  font-size: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-size: 14px;
  color: #666;
}
</style>
