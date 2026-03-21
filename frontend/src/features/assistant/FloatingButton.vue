<script setup lang="ts">
import { ref } from "vue";
import DrawerChat from "./DrawerChat.vue";
import PopupChat from "./PopupChat.vue";

const mode = ref<"closed" | "popup" | "drawer">("closed");

function toggle() {
  mode.value = mode.value === "closed" ? "popup" : "closed";
}

function expandToDrawer() {
  mode.value = "drawer";
}

function close() {
  mode.value = "closed";
}
</script>

<template>
  <div class="floating-assistant">
    <Transition name="popup">
      <PopupChat v-if="mode === 'popup'" @close="close" @expand="expandToDrawer" />
    </Transition>
    <DrawerChat :open="mode === 'drawer'" @close="close" />
    <a-float-button
      type="primary"
      :style="{ right: '24px', bottom: '24px' }"
      @click="toggle"
    >
      <template #icon>
        <span style="font-size: 20px">AI</span>
      </template>
    </a-float-button>
  </div>
</template>

<style scoped>
.popup-enter-active,
.popup-leave-active {
  transition: all 0.3s ease;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
