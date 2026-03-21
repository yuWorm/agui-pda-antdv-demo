import { ref } from "vue";
import { useRouter } from "vue-router";
import { authApi } from "@/services/auth";
import { useAuthStore } from "@/stores/auth";

export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();
  const loading = ref(false);
  const error = ref("");

  async function login(username: string, password: string) {
    loading.value = true;
    error.value = "";
    try {
      const { data } = await authApi.login({ username, password });
      store.setTokens(data.access_token, data.refresh_token);
      const { data: user } = await authApi.getMe();
      store.setUser(user);
      await router.push("/chat");
    } catch (e: any) {
      error.value = e.response?.data?.detail || "Login failed";
    } finally {
      loading.value = false;
    }
  }

  async function register(username: string, password: string, displayName?: string) {
    loading.value = true;
    error.value = "";
    try {
      const { data } = await authApi.register({ username, password, display_name: displayName });
      store.setTokens(data.access_token, data.refresh_token);
      const { data: user } = await authApi.getMe();
      store.setUser(user);
      await router.push("/chat");
    } catch (e: any) {
      error.value = e.response?.data?.detail || "Registration failed";
    } finally {
      loading.value = false;
    }
  }

  async function fetchUser() {
    if (!store.isAuthenticated) return;
    try {
      const { data } = await authApi.getMe();
      store.setUser(data);
    } catch {
      store.logout();
    }
  }

  function logout() {
    store.logout();
    router.push("/login");
  }

  return { loading, error, login, register, fetchUser, logout };
}
