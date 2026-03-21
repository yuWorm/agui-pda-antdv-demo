<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AuthLayout from "@/layouts/AuthLayout.vue";
import MainLayout from "@/layouts/MainLayout.vue";

const route = useRoute();
const layout = computed(() => (route.meta.layout === "auth" ? AuthLayout : MainLayout));
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
</template>
