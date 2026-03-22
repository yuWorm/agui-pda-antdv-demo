<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { theme } from "antdv-next";
import FloatingButton from "@/features/assistant/FloatingButton.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";
import MainLayout from "@/layouts/MainLayout.vue";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";

const route = useRoute();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();

const layout = computed(() => (route.meta.layout === "auth" ? AuthLayout : MainLayout));
const showFloating = computed(
  () =>
    authStore.isAuthenticated &&
    route.name !== "chat" &&
    route.name !== "chat-session" &&
    route.name !== "demo",
);

const themeConfig = computed(() => ({
  algorithm: settingsStore.isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
}));
</script>

<template>
  <a-config-provider :theme="themeConfig">
    <component :is="layout">
      <router-view />
    </component>
    <FloatingButton v-if="showFloating" />
  </a-config-provider>
</template>
