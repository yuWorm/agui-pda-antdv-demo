export interface Session {
  id: string;
  title: string;
  model_provider: string;
  model_name: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls: ToolCallRecord[] | null;
  metadata_: Record<string, unknown> | null;
  ordering: number;
  created_at: string;
}

export interface ToolCallRecord {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  status: "pending" | "confirmed" | "rejected" | "completed" | "error";
  confirmed_by_user?: boolean;
}

export type StreamingStatus = "idle" | "streaming" | "error";
