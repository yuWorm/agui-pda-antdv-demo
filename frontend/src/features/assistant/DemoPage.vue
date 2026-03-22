<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import DrawerChat from "./DrawerChat.vue";
import PopupChat from "./PopupChat.vue";
import { useSessions } from "@/composables/useSessions";
import { useChatStore } from "@/stores/chat";

const router = useRouter();
const chatStore = useChatStore();
const { createSession, loadSessions } = useSessions({ navigate: false });

const showPopup = ref(false);
const showDrawer = ref(false);

async function ensureSession() {
  await loadSessions();
  if (!chatStore.currentSessionId) {
    await createSession();
  }
}

async function openPopup() {
  await ensureSession();
  showDrawer.value = false;
  showPopup.value = true;
}

async function openDrawer() {
  await ensureSession();
  showPopup.value = false;
  showDrawer.value = true;
}

function closeAll() {
  showPopup.value = false;
  showDrawer.value = false;
}

function goFullPage() {
  router.push("/chat");
}

const modes = [
  {
    key: "popup",
    title: "Popup Chat",
    desc: "Floating popup window in the bottom-right corner, compact and non-intrusive.",
    icon: "💬",
  },
  {
    key: "drawer",
    title: "Drawer Chat",
    desc: "Side drawer panel that slides in from the right, larger conversation area.",
    icon: "📋",
  },
  {
    key: "fullpage",
    title: "Full-Page Chat",
    desc: "Dedicated chat page with sidebar session list, full-featured experience.",
    icon: "🖥️",
  },
];

function handleClick(key: string) {
  if (key === "popup") openPopup();
  else if (key === "drawer") openDrawer();
  else if (key === "fullpage") goFullPage();
}
</script>

<template>
  <div class="demo-page">
    <header class="demo-header">
      <h1 class="demo-title">AG-UI Assistant Demo</h1>
      <p class="demo-subtitle">Preview different assistant presentation modes</p>
    </header>

    <div class="mode-grid">
      <div v-for="m in modes" :key="m.key" class="mode-card" @click="handleClick(m.key)">
        <div class="mode-icon">{{ m.icon }}</div>
        <div class="mode-info">
          <h3 class="mode-title">{{ m.title }}</h3>
          <p class="mode-desc">{{ m.desc }}</p>
        </div>
        <a-button type="primary" size="large" class="mode-btn">
          {{ m.key === "fullpage" ? "Navigate" : "Open" }}
        </a-button>
      </div>
    </div>

    <section class="demo-section">
      <h2 class="section-title">Floating Button</h2>
      <p class="section-desc">
        The floating button appears on all non-chat pages when logged in. It opens a popup first,
        then can be expanded to a drawer. Go to
        <a href="/chat" @click.prevent="goFullPage">full-page chat</a>
        to see the button in the bottom-right corner.
      </p>
    </section>

    <Transition name="popup-fade">
      <PopupChat v-if="showPopup" @close="closeAll" @expand="openDrawer" />
    </Transition>
    <DrawerChat :open="showDrawer" @close="closeAll" />
  </div>
</template>

<style scoped>
.demo-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 60px 24px 120px;
}

.demo-header {
  text-align: center;
  margin-bottom: 48px;
}

.demo-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.demo-subtitle {
  font-size: 15px;
  color: var(--color-text-muted);
  margin: 0;
}

.mode-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 48px;
}

.mode-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 12px rgba(22, 119, 255, 0.08);
  transform: translateY(-1px);
}

.mode-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  border-radius: 12px;
  flex-shrink: 0;
}

.mode-info {
  flex: 1;
  min-width: 0;
}

.mode-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 4px;
}

.mode-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

.mode-btn {
  flex-shrink: 0;
}

.demo-section {
  padding: 24px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.section-desc {
  font-size: 14px;
  color: var(--color-text-tertiary);
  margin: 0;
  line-height: 1.6;
}

.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: all 0.3s ease;
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
