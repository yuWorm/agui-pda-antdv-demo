export interface AguiConfig {
  url: string;
  headers?: Record<string, string>;
}

export interface SharedState {
  [key: string]: unknown;
}
