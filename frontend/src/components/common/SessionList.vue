<script setup lang="ts">
import { useSessions } from "@/composables/useSessions";
import { useChatStore } from "@/stores/chat";

const chatStore = useChatStore();
const { sessions, createSession, selectSession, deleteSession } = useSessions();
</script>

<template>
  <div class="session-list">
    <a-button type="primary" block @click="createSession()" style="margin-bottom: 12px">
      + New Chat
    </a-button>
    <div class="sessions-scroll">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="session-item"
        :class="{ active: chatStore.currentSessionId === session.id }"
        @click="selectSession(session.id)"
      >
        <div class="session-title">{{ session.title }}</div>
        <a-button type="text" size="small" danger @click.stop="deleteSession(session.id)">
          &times;
        </a-button>
      </div>
      <div v-if="sessions.length === 0" class="empty">No conversations yet</div>
    </div>
  </div>
</template>

<style scoped>
.session-list {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sessions-scroll {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.2s;
}

.session-item:hover {
  background: #f5f5f5;
}

.session-item.active {
  background: #e6f4ff;
}

.session-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 24px;
}
</style>
