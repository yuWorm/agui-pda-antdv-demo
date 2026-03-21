import { HttpAgent } from "@ag-ui/client";
import type { AgentSubscriber } from "@ag-ui/client";
import { ref } from "vue";
import { useChatStore } from "@/stores/chat";
import type { ToolCallRecord } from "@/types/chat";

export function useAgui() {
  const chatStore = useChatStore();
  const pendingToolCalls = ref<ToolCallRecord[]>([]);
  const currentAgent = ref<HttpAgent | null>(null);

  function createAgent(
    threadId: string,
    messageHistory: Array<{ role: string; content: string }>,
  ): HttpAgent {
    const token = localStorage.getItem("access_token") || "";
    const agent = new HttpAgent({
      url: "/api/agui",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      threadId,
      initialMessages: messageHistory.map((m) => ({
        id: crypto.randomUUID(),
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    });
    currentAgent.value = agent;
    return agent;
  }

  async function sendMessage(
    _content: string,
    threadId: string,
    messageHistory: Array<{ role: string; content: string }>,
  ) {
    const agent = createAgent(threadId, messageHistory);
    chatStore.setStreamingStatus("streaming");
    chatStore.updateLastAssistantContent("");
    pendingToolCalls.value = [];

    let fullContent = "";
    let currentToolCall: ToolCallRecord | null = null;

    const subscriber: AgentSubscriber = {
      onTextMessageContentEvent({ textMessageBuffer }) {
        fullContent = textMessageBuffer;
        chatStore.updateLastAssistantContent(fullContent);
      },
      onToolCallStartEvent({ event }) {
        currentToolCall = {
          id: event.toolCallId || crypto.randomUUID(),
          name: event.toolCallName || "",
          arguments: {},
          status: "pending",
        };
        pendingToolCalls.value.push(currentToolCall);
      },
      onToolCallArgsEvent({ partialToolCallArgs }) {
        if (currentToolCall) {
          currentToolCall.arguments = { ...partialToolCallArgs };
        }
      },
      onToolCallEndEvent({ toolCallArgs }) {
        if (currentToolCall) {
          currentToolCall.arguments = { ...toolCallArgs };
          currentToolCall.status = "completed";
          currentToolCall = null;
        }
      },
      onStateSnapshotEvent({ state }) {
        chatStore.updateSharedState(state as Record<string, unknown>);
      },
      onStateDeltaEvent({ event }) {
        if (event.delta && Array.isArray(event.delta)) {
          const patch: Record<string, unknown> = {};
          for (const op of event.delta) {
            if (op.op === "replace" || op.op === "add") {
              const key = String(op.path).replace(/^\//, "").split("/")[0];
              patch[key] = op.value;
            }
          }
          if (Object.keys(patch).length) {
            chatStore.mergeSharedState(patch);
          }
        }
      },
      onRunErrorEvent() {
        chatStore.setStreamingStatus("error");
      },
    };

    try {
      await agent.runAgent({}, subscriber);

      const completedToolCalls = pendingToolCalls.value.filter(
        (t) => t.status !== "pending",
      );
      chatStore.finalizeAssistantMessage(fullContent, {
        tool_calls: completedToolCalls.length > 0 ? completedToolCalls : null,
      });
    } catch {
      chatStore.setStreamingStatus("error");
      if (fullContent) {
        chatStore.finalizeAssistantMessage(fullContent);
      }
    }
  }

  function abortRun() {
    if (currentAgent.value) {
      currentAgent.value.abortRun();
    }
    currentAgent.value = null;
    chatStore.setStreamingStatus("idle");
  }

  return { sendMessage, abortRun, pendingToolCalls };
}
