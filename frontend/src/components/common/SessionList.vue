<script setup lang="ts">
import type { MenuItemType } from "antdv-next";
import { computed, ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useSessions } from "@/composables/useSessions";
import { useAuthStore } from "@/stores/auth";
import { useChatStore } from "@/stores/chat";
import { useSettingsStore } from "@/stores/settings";
import type { Session } from "@/types/chat";

const chatStore = useChatStore();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const { sessions, createSession, selectSession, deleteSession, renameSession } = useSessions();
const { logout } = useAuth();

const deletingId = ref<string | null>(null);

function getSessionMenuItems(): MenuItemType[] {
  return [
    { label: "Rename", key: "rename" },
    { type: "divider" },
    { label: "Delete", key: "delete", danger: true },
  ];
}

function handleMenuClick(session: Session, info: { key: string }) {
  if (info.key === "rename") startRename(session);
  else if (info.key === "delete") confirmDelete(session.id);
}

async function confirmDelete(sessionId: string) {
  deletingId.value = sessionId;
}

async function doDelete() {
  if (!deletingId.value) return;
  await deleteSession(deletingId.value);
  deletingId.value = null;
}

function cancelDelete() {
  deletingId.value = null;
}

const renamingId = ref<string | null>(null);
const renameTitle = ref("");

function startRename(session: Session) {
  renamingId.value = session.id;
  renameTitle.value = session.title;
}

async function submitRename(sessionId: string) {
  if (renameTitle.value.trim()) {
    await renameSession(sessionId, renameTitle.value.trim());
  }
  renamingId.value = null;
}

function cancelRename() {
  renamingId.value = null;
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isYesterday(dateStr: string) {
  const d = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
}

interface SessionGroup {
  label: string;
  sessions: Session[];
}

const groupedSessions = computed<SessionGroup[]>(() => {
  const today: Session[] = [];
  const yesterday: Session[] = [];
  const earlier: Session[] = [];

  for (const s of sessions.value) {
    if (isToday(s.created_at)) today.push(s);
    else if (isYesterday(s.created_at)) yesterday.push(s);
    else earlier.push(s);
  }

  const groups: SessionGroup[] = [];
  if (today.length) groups.push({ label: "Today", sessions: today });
  if (yesterday.length) groups.push({ label: "Yesterday", sessions: yesterday });
  if (earlier.length) groups.push({ label: "Earlier", sessions: earlier });
  return groups;
});
</script>

<template>
  <div class="session-panel">
    <div class="brand-header">
      <div class="brand-logo">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <span class="brand-name">AG-UI Demo</span>
    </div>

    <div class="new-chat-area">
      <a-button class="new-chat-btn" block @click="createSession()">
        + New chat
      </a-button>
    </div>

    <div class="sessions-scroll">
      <template v-if="groupedSessions.length">
        <div v-for="group in groupedSessions" :key="group.label" class="session-group">
          <div class="group-label">{{ group.label }}</div>
          <div
            v-for="session in group.sessions"
            :key="session.id"
            class="session-item"
            :class="{ active: chatStore.currentSessionId === session.id }"
            @click="selectSession(session.id)"
          >
            <template v-if="renamingId === session.id">
              <a-input
                v-model:value="renameTitle"
                size="small"
                class="rename-input"
                @press-enter="submitRename(session.id)"
                @blur="cancelRename"
                @click.stop
              />
            </template>
            <template v-else>
              <span class="session-title">{{ session.title }}</span>
              <div @click.stop>
                <a-dropdown
                  :menu="{ items: getSessionMenuItems(), onClick: (info: { key: string }) => handleMenuClick(session, info) }"
                  :trigger="['click']"
                >
                  <span class="session-more" @click.prevent>...</span>
                </a-dropdown>
              </div>
            </template>
          </div>
        </div>
      </template>
      <div v-else class="empty-hint">No conversations yet</div>
    </div>

    <a-modal
      :open="!!deletingId"
      title="Delete Conversation"
      ok-text="Delete"
      ok-type="danger"
      @ok="doDelete"
      @cancel="cancelDelete"
    >
      <p>Are you sure you want to delete this conversation? This action cannot be undone.</p>
    </a-modal>

    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">
          {{ authStore.user?.display_name?.charAt(0)?.toUpperCase() || "U" }}
        </div>
        <span class="user-name">{{ authStore.user?.display_name || "User" }}</span>
      </div>
      <div class="footer-actions">
        <button class="icon-btn" title="Toggle theme" @click="settingsStore.toggleTheme">
          <!-- Sun icon (shown in dark mode) -->
          <svg v-if="settingsStore.isDark" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <!-- Moon icon (shown in light mode) -->
          <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </button>
        <button class="icon-btn logout-btn" title="Logout" @click="logout">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.session-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.brand-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 12px;
}

.brand-logo {
  color: var(--color-primary);
}

.brand-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.new-chat-area {
  padding: 0 16px 12px;
}

.new-chat-btn {
  border-radius: 8px;
  height: 38px;
  font-size: 14px;
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: transparent;
  font-weight: 500;
}

.new-chat-btn:hover {
  background: var(--color-primary-bg);
}

.sessions-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.session-group {
  margin-bottom: 4px;
}

.group-label {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 8px 12px 4px;
  font-weight: 500;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  gap: 4px;
}

.session-item:hover {
  background: var(--color-bg-hover);
}

.session-item.active {
  background: var(--color-bg-active);
}

.session-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.session-more {
  opacity: 0;
  cursor: pointer;
  font-weight: bold;
  color: var(--color-text-muted);
  padding: 0 4px;
  letter-spacing: 1px;
  font-size: 14px;
  transition: opacity 0.2s;
  user-select: none;
}

.session-item:hover .session-more {
  opacity: 1;
}

.rename-input {
  width: 100%;
}

.empty-hint {
  text-align: center;
  color: var(--color-text-hint);
  padding: 40px 16px;
  font-size: 14px;
}

.sidebar-footer {
  border-top: 1px solid var(--color-border);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.user-name {
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.logout-btn:hover {
  color: var(--color-danger);
}
</style>
