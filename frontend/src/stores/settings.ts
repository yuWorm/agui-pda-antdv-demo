import { defineStore } from "pinia";
import { ref, watch } from "vue";

export const useSettingsStore = defineStore("settings", () => {
  const modelProvider = ref(localStorage.getItem("model_provider") || "openai");
  const modelName = ref(localStorage.getItem("model_name") || "gpt-4o");

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const stored = localStorage.getItem("theme");
  const isDark = ref(stored ? stored === "dark" : prefersDark);

  function setModel(provider: string, name: string) {
    modelProvider.value = provider;
    modelName.value = name;
    localStorage.setItem("model_provider", provider);
    localStorage.setItem("model_name", name);
  }

  function toggleTheme() {
    isDark.value = !isDark.value;
  }

  function applyTheme(dark: boolean) {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }

  watch(isDark, (val) => applyTheme(val), { immediate: true });

  return { modelProvider, modelName, isDark, setModel, toggleTheme };
});
