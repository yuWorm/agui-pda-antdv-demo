<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import FloatingButton from "@/features/assistant/FloatingButton.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";
import MainLayout from "@/layouts/MainLayout.vue";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const authStore = useAuthStore();
const layout = computed(() => (route.meta.layout === "auth" ? AuthLayout : MainLayout));
const showFloating = computed(
  () => authStore.isAuthenticated && route.name !== "chat" && route.name !== "chat-session",
);
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
  <FloatingButton v-if="showFloating" />
</template>
