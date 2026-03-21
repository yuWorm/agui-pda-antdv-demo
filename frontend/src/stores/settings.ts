import { defineStore } from "pinia";
import { ref } from "vue";

export const useSettingsStore = defineStore("settings", () => {
  const modelProvider = ref(localStorage.getItem("model_provider") || "openai");
  const modelName = ref(localStorage.getItem("model_name") || "gpt-4o");

  function setModel(provider: string, name: string) {
    modelProvider.value = provider;
    modelName.value = name;
    localStorage.setItem("model_provider", provider);
    localStorage.setItem("model_name", name);
  }

  return { modelProvider, modelName, setModel };
});
