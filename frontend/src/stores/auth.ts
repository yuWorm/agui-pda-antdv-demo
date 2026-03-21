import { defineStore } from "pinia";
import { ref } from "vue";
import type { User } from "@/types/auth";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const isAuthenticated = ref(!!localStorage.getItem("access_token"));

  function setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    isAuthenticated.value = true;
  }

  function setUser(u: User) {
    user.value = u;
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    user.value = null;
    isAuthenticated.value = false;
  }

  return { user, isAuthenticated, setTokens, setUser, logout };
});
