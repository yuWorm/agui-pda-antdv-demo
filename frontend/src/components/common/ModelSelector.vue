<script setup lang="ts">
import { useSettingsStore } from "@/stores/settings";

const store = useSettingsStore();

const models = [
  { label: "GPT-4o", provider: "openai", name: "gpt-4o" },
  { label: "GPT-4o Mini", provider: "openai", name: "gpt-4o-mini" },
  { label: "DeepSeek V3", provider: "deepseek", name: "deepseek-chat" },
  { label: "Qwen Max", provider: "qwen", name: "qwen-max" },
];

function handleChange(value: string) {
  const model = models.find((m) => `${m.provider}:${m.name}` === value);
  if (model) store.setModel(model.provider, model.name);
}
</script>

<template>
  <a-select
    :value="`${store.modelProvider}:${store.modelName}`"
    @change="handleChange"
    style="width: 180px"
    size="small"
  >
    <a-select-option v-for="m in models" :key="`${m.provider}:${m.name}`" :value="`${m.provider}:${m.name}`">
      {{ m.label }}
    </a-select-option>
  </a-select>
</template>
