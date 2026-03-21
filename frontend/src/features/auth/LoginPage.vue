<script setup lang="ts">
import { reactive } from "vue";
import { useAuth } from "@/composables/useAuth";

const { login, loading, error } = useAuth();
const form = reactive({ username: "", password: "" });

async function handleSubmit() {
  await login(form.username, form.password);
}
</script>

<template>
  <a-form layout="vertical" @finish="handleSubmit">
    <a-alert v-if="error" type="error" :message="error" show-icon style="margin-bottom: 16px" />
    <a-form-item label="Username" name="username" :rules="[{ required: true }]">
      <a-input v-model:value="form.username" size="large" placeholder="Enter username" />
    </a-form-item>
    <a-form-item label="Password" name="password" :rules="[{ required: true }]">
      <a-input-password v-model:value="form.password" size="large" placeholder="Enter password" />
    </a-form-item>
    <a-form-item>
      <a-button type="primary" html-type="submit" :loading="loading" block size="large">
        Login
      </a-button>
    </a-form-item>
    <div style="text-align: center">
      Don't have an account?
      <router-link to="/register">Register</router-link>
    </div>
  </a-form>
</template>
