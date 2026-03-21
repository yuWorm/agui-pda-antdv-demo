import api from "./api";
import type { LoginRequest, RegisterRequest, TokenResponse, User } from "@/types/auth";

export const authApi = {
  register(data: RegisterRequest) {
    return api.post<TokenResponse>("/auth/register", data);
  },
  login(data: LoginRequest) {
    return api.post<TokenResponse>("/auth/login", data);
  },
  refresh(refreshToken: string) {
    return api.post<TokenResponse>("/auth/refresh", { refresh_token: refreshToken });
  },
  getMe() {
    return api.get<User>("/auth/me");
  },
};
