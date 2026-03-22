export interface Session {
  id: string;
  title: string;
  model_provider: string;
  model_name: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  mime_type: string;
  size: number;
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  reasoning?: string | null;
  tool_calls: ToolCallRecord[] | null;
  attachments?: Attachment[] | null;
  metadata_: Record<string, unknown> | null;
  ordering: number;
  created_at: string;
}

export interface ToolCallRecord {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  status: "pending" | "awaiting_confirmation" | "confirmed" | "rejected" | "executing" | "completed" | "error";
}

export type StreamingStatus = "idle" | "streaming" | "confirming" | "executing" | "error";
