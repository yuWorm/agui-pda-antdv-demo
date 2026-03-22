import { createApp } from "vue";
import { createPinia } from "pinia";
import Antd from "antdv-next";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(Antd);
import "./styles/global.css";
app.mount("#app");
