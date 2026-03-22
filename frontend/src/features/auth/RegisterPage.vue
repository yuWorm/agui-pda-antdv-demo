<script setup lang="ts">
import { reactive } from "vue";
import { useAuth } from "@/composables/useAuth";

const { register, loading, error } = useAuth();
const form = reactive({ username: "", password: "", display_name: "" });

async function handleSubmit() {
  await register(form.username, form.password, form.display_name);
}
</script>

<template>
  <a-form :model="form" layout="vertical" @finish="handleSubmit">
    <a-alert v-if="error" type="error" :message="error" show-icon style="margin-bottom: 16px" />
    <a-form-item label="Username" name="username" :rules="[{ required: true, min: 3 }]">
      <a-input v-model:value="form.username" size="large" placeholder="Choose a username" />
    </a-form-item>
    <a-form-item label="Display Name" name="display_name">
      <a-input v-model:value="form.display_name" size="large" placeholder="Your display name" />
    </a-form-item>
    <a-form-item label="Password" name="password" :rules="[{ required: true, min: 6 }]">
      <a-input-password v-model:value="form.password" size="large" placeholder="Choose a password" />
    </a-form-item>
    <a-form-item>
      <a-button type="primary" html-type="submit" :loading="loading" block size="large">
        Register
      </a-button>
    </a-form-item>
    <div style="text-align: center">
      Already have an account?
      <router-link to="/login">Login</router-link>
    </div>
  </a-form>
</template>
