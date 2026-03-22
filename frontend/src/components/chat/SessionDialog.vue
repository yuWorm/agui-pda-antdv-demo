<script setup lang="ts">
import type { MenuItemType } from "antdv-next";
import { computed, ref, watch } from "vue";
import { useSessions } from "@/composables/useSessions";
import { useChatStore } from "@/stores/chat";
import type { Session } from "@/types/chat";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [value: boolean] }>();

const chatStore = useChatStore();
const { sessions, loadSessions, createSession, selectSession, deleteSession, renameSession } =
  useSessions({ navigate: false });

watch(
  () => props.open,
  (val) => {
    if (val) loadSessions();
  },
);

function handleSelect(sessionId: string) {
  selectSession(sessionId);
  emit("update:open", false);
}

async function handleCreate() {
  await createSession();
  emit("update:open", false);
}

const deletingId = ref<string | null>(null);

function confirmDelete(id: string) {
  deletingId.value = id;
}

async function doDelete() {
  if (!deletingId.value) return;
  await deleteSession(deletingId.value);
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

function getMenuItems(): MenuItemType[] {
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

function isToday(dateStr: string) {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isYesterday(dateStr: string) {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return new Date(dateStr).toDateString() === y.toDateString();
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
  <a-modal
    :open="open"
    title="Chat Sessions"
    :footer="null"
    width="420px"
    :body-style="{ padding: 0, maxHeight: '60vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }"
    @cancel="emit('update:open', false)"
  >
    <div class="sd-toolbar">
      <a-button type="primary" block @click="handleCreate">+ New Chat</a-button>
    </div>

    <div class="sd-list">
      <template v-if="groupedSessions.length">
        <div v-for="group in groupedSessions" :key="group.label" class="sd-group">
          <div class="sd-group-label">{{ group.label }}</div>
          <div
            v-for="session in group.sessions"
            :key="session.id"
            class="sd-item"
            :class="{ active: chatStore.currentSessionId === session.id }"
            @click="handleSelect(session.id)"
          >
            <template v-if="renamingId === session.id">
              <a-input
                v-model:value="renameTitle"
                size="small"
                class="sd-rename-input"
                @press-enter="submitRename(session.id)"
                @blur="renamingId = null"
                @click.stop
              />
            </template>
            <template v-else>
              <span class="sd-title">{{ session.title }}</span>
              <div @click.stop>
                <a-dropdown
                  :menu="{ items: getMenuItems(), onClick: (info: { key: string }) => handleMenuClick(session, info) }"
                  :trigger="['click']"
                >
                  <span class="sd-more">...</span>
                </a-dropdown>
              </div>
            </template>
          </div>
        </div>
      </template>
      <div v-else class="sd-empty">No conversations yet</div>
    </div>

    <a-modal
      :open="!!deletingId"
      title="Delete Conversation"
      ok-text="Delete"
      ok-type="danger"
      @ok="doDelete"
      @cancel="deletingId = null"
    >
      <p>Are you sure you want to delete this conversation? This action cannot be undone.</p>
    </a-modal>
  </a-modal>
</template>

<style scoped>
.sd-toolbar {
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--color-border);
}

.sd-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.sd-group {
  margin-bottom: 4px;
}

.sd-group-label {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 8px 12px 4px;
  font-weight: 500;
}

.sd-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  gap: 4px;
}

.sd-item:hover {
  background: var(--color-bg-hover);
}

.sd-item.active {
  background: var(--color-bg-active);
}

.sd-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.sd-more {
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

.sd-item:hover .sd-more {
  opacity: 1;
}

.sd-rename-input {
  width: 100%;
}

.sd-empty {
  text-align: center;
  color: var(--color-text-hint);
  padding: 40px 16px;
  font-size: 14px;
}
</style>
