import { HttpAgent } from "@ag-ui/client";
import type { AgentSubscriber } from "@ag-ui/client";
import type { Message as AGUIMessage } from "@ag-ui/core";
import { ref } from "vue";
import { chatApi } from "@/services/chat";
import { useChatStore } from "@/stores/chat";
import type { ToolCallRecord } from "@/types/chat";

interface HistoryMessage {
  role: string;
  content: string;
}

export function useAgui() {
  const chatStore = useChatStore();
  const pendingToolCalls = ref<ToolCallRecord[]>([]);
  const currentAgent = ref<HttpAgent | null>(null);
  let confirmResolve: (() => void) | null = null;

  function buildAGUIMessages(history: HistoryMessage[]): AGUIMessage[] {
    return history.map((m) => ({
      id: crypto.randomUUID(),
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));
  }

  function createAgent(threadId: string, messages: AGUIMessage[]): HttpAgent {
    const token = localStorage.getItem("access_token") || "";
    const agent = new HttpAgent({
      url: "/api/agui",
      headers: { Authorization: `Bearer ${token}` },
      threadId,
      initialMessages: messages,
    });
    currentAgent.value = agent;
    return agent;
  }

  function buildSubscriber() {
    let fullContent = "";
    let fullReasoning = "";
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
          currentToolCall.status = "awaiting_confirmation";
          currentToolCall = null;
        }
      },
      onToolCallResultEvent({ event }) {
        const tc = pendingToolCalls.value.find((t) => t.id === event.toolCallId);
        if (tc) {
          tc.result = event.content;
          tc.status = "completed";
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
      onReasoningMessageContentEvent({ reasoningMessageBuffer }) {
        fullReasoning = reasoningMessageBuffer;
        chatStore.updateStreamingReasoning(fullReasoning);
      },
      onRunErrorEvent() {
        chatStore.setStreamingStatus("error");
      },
    };

    return { subscriber, getContent: () => fullContent, getReasoning: () => fullReasoning };
  }

  async function runAgentCall(
    threadId: string,
    messages: AGUIMessage[],
  ): Promise<{ content: string; reasoning: string }> {
    const agent = createAgent(threadId, messages);
    const { subscriber, getContent, getReasoning } = buildSubscriber();
    await agent.runAgent({}, subscriber);
    return { content: getContent(), reasoning: getReasoning() };
  }

  async function sendMessage(
    _content: string,
    threadId: string,
    messageHistory: HistoryMessage[],
  ) {
    const aguiMessages = buildAGUIMessages(messageHistory);
    chatStore.setStreamingStatus("streaming");
    chatStore.updateLastAssistantContent("");
    chatStore.updateStreamingReasoning("");
    pendingToolCalls.value = [];

    try {
      const { content, reasoning } = await runAgentCall(threadId, aguiMessages);

      const deferredCalls = pendingToolCalls.value.filter(
        (t) => t.status === "awaiting_confirmation",
      );

      if (deferredCalls.length > 0) {
        chatStore.setStreamingStatus("confirming");
        await handleConfirmedTools(threadId, aguiMessages, content, reasoning);
        return;
      }

      finalize(content, reasoning);
    } catch {
      chatStore.setStreamingStatus("error");
    }
  }

  function waitForAllSettled(): Promise<void> {
    return new Promise((resolve) => {
      confirmResolve = resolve;
      checkAllSettled();
    });
  }

  function checkAllSettled() {
    const hasPending = pendingToolCalls.value.some(
      (t) => t.status === "awaiting_confirmation" || t.status === "executing",
    );
    if (!hasPending && confirmResolve) {
      confirmResolve();
      confirmResolve = null;
    }
  }

  async function executeToolCall(tc: ToolCallRecord) {
    tc.status = "executing";
    chatStore.setStreamingStatus("executing");
    try {
      const { data } = await chatApi.executeTool(tc.name, tc.arguments);
      tc.result = data.result;
      tc.status = "completed";
    } catch (e) {
      tc.result = `Execution failed: ${e}`;
      tc.status = "error";
    }
    checkAllSettled();
  }

  function resolveConfirmation(toolCallId: string, approved: boolean) {
    const tc = pendingToolCalls.value.find((t) => t.id === toolCallId);
    if (!tc) return;

    if (approved) {
      executeToolCall(tc);
    } else {
      tc.status = "rejected";
      tc.result = "Tool call was denied by user.";
      checkAllSettled();
    }
  }

  async function handleConfirmedTools(
    threadId: string,
    previousMessages: AGUIMessage[],
    partialContent: string,
    partialReasoning: string,
  ) {
    await waitForAllSettled();

    const snapshotToolCalls = pendingToolCalls.value.map((tc) => ({ ...tc }));
    const hasApproved = snapshotToolCalls.some((t) => t.status === "completed");

    if (!hasApproved) {
      chatStore.finalizeAssistantMessage(partialContent, {
        reasoning: partialReasoning || null,
        tool_calls: snapshotToolCalls.length > 0 ? snapshotToolCalls : null,
      });
      return;
    }

    chatStore.commitAssistantMessage(partialContent, {
      reasoning: partialReasoning || null,
      tool_calls: snapshotToolCalls.length > 0 ? snapshotToolCalls : null,
    });

    const assistantMsg: AGUIMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: partialContent || "",
      toolCalls: pendingToolCalls.value.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.arguments),
        },
      })),
    };

    const toolResultMsgs: AGUIMessage[] = pendingToolCalls.value.map((tc) => ({
      id: crypto.randomUUID(),
      role: "tool" as const,
      content: tc.result || "No result",
      toolCallId: tc.id,
    }));

    const extendedMessages = [...previousMessages, assistantMsg, ...toolResultMsgs];

    chatStore.setStreamingStatus("streaming");
    chatStore.updateLastAssistantContent("");
    chatStore.updateStreamingReasoning("");
    pendingToolCalls.value = [];

    try {
      const { content, reasoning } = await runAgentCall(threadId, extendedMessages);

      const deferredCalls = pendingToolCalls.value.filter(
        (t) => t.status === "awaiting_confirmation",
      );

      if (deferredCalls.length > 0) {
        chatStore.setStreamingStatus("confirming");
        await handleConfirmedTools(threadId, extendedMessages, content, reasoning);
        return;
      }

      finalize(content, reasoning);
    } catch {
      chatStore.setStreamingStatus("error");
    }
  }

  function finalize(content: string, reasoning: string) {
    const completedToolCalls = pendingToolCalls.value.filter(
      (t) => t.status !== "pending" && t.status !== "awaiting_confirmation",
    );
    chatStore.finalizeAssistantMessage(content, {
      reasoning: reasoning || null,
      tool_calls: completedToolCalls.length > 0 ? completedToolCalls : null,
    });
  }

  function abortRun() {
    if (currentAgent.value) {
      currentAgent.value.abortRun();
    }
    currentAgent.value = null;
    if (confirmResolve) {
      confirmResolve();
      confirmResolve = null;
    }
    chatStore.setStreamingStatus("idle");
  }

  return { sendMessage, abortRun, pendingToolCalls, resolveConfirmation };
}
