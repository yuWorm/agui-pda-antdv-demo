import { ref } from "vue";

export function useAuth() {
  const loading = ref(false);
  const error = ref("");

  async function login(_username: string, _password: string) {
    // Stub - will be implemented with auth store
  }

  async function register(_username: string, _password: string, _displayName?: string) {
    // Stub - will be implemented with auth store
  }

  async function fetchUser() {
    // Stub
  }

  function logout() {
    // Stub
  }

  return { loading, error, login, register, fetchUser, logout };
}
