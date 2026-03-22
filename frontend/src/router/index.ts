import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/features/auth/LoginPage.vue"),
      meta: { layout: "auth", requiresAuth: false },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/features/auth/RegisterPage.vue"),
      meta: { layout: "auth", requiresAuth: false },
    },
    {
      path: "/chat",
      name: "chat",
      component: () => import("@/features/chat/ChatPage.vue"),
      meta: { layout: "main", requiresAuth: true },
    },
    {
      path: "/chat/:sessionId",
      name: "chat-session",
      component: () => import("@/features/chat/ChatPage.vue"),
      meta: { layout: "main", requiresAuth: true },
    },
    {
      path: "/demo",
      name: "demo",
      component: () => import("@/features/assistant/DemoPage.vue"),
      meta: { layout: "main", requiresAuth: true },
    },
    {
      path: "/",
      redirect: "/chat",
    },
  ],
});

router.beforeEach((to) => {
  const token = localStorage.getItem("access_token");
  if (to.meta.requiresAuth && !token) {
    return { name: "login" };
  }
  if (!to.meta.requiresAuth && token && (to.name === "login" || to.name === "register")) {
    return { name: "chat" };
  }
});

export default router;
