<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-header">
        <div class="auth-logo">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1>AG-UI Demo</h1>
        <p>Agent Interaction Platform</p>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
}

.auth-container {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  background: var(--color-bg-elevated);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--color-bg-avatar);
  color: var(--color-primary);
  margin-bottom: 16px;
}

.auth-header h1 {
  font-size: 24px;
  color: var(--color-text-primary);
  margin: 0 0 8px;
  font-weight: 600;
}

.auth-header p {
  color: var(--color-text-muted);
  font-size: 14px;
  margin: 0;
}
</style>
