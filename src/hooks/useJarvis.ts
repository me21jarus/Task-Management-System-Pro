import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";
import { JarvisMessage } from "../types/user";
import { getJarvisHistory, addJarvisMessage, clearJarvisHistory as clearIDBHistory } from "../lib/db";
import { createTaskManager } from "../lib/task-manager";
import { toolExecutors } from "../lib/jarvis-tools";
import { useTaskContext } from "../contexts/TaskContext";
import { useTheme } from "./useTheme";
import { logger } from "../lib/logger";

export type JarvisStatus = "idle" | "thinking" | "speaking" | "error" | "cooldown";

const MIN_INTERVAL_MS = 12000; // 12s gap — safely under 5 RPM free-tier quota
const RATE_LIMIT_COOLDOWNS = [30, 60, 90]; // escalating backoff on repeated 429s

function localNarrate(toolName: string, args: Record<string, any>, result: any): string {
  const title = args?.title || args?.query || "";
  switch (toolName) {
    case "addTask":        return `Done! I've added "${args.title}" to your tasks.`;
    case "deleteTask":     return `Got it — "${title}" has been deleted.`;
    case "markComplete":   return `"${title}" marked as complete.`;
    case "markIncomplete": return `"${title}" moved back to pending.`;
    case "updateTask":     return `"${title}" has been updated.`;
    case "filterTasks":    return "Filters applied — showing matching tasks.";
    case "sortTasks":      return `Tasks sorted by ${args?.by || "the selected field"}.`;
    case "clearFilters":   return "Filters cleared — showing all tasks.";
    case "searchTasks":    return `Showing results for "${args?.query}".`;
    case "switchTheme":    return `Switched to ${args?.theme} mode.`;
    case "getTasksSummary":
      return typeof result === "string" ? result : `You have ${Array.isArray(result) ? result.length : 0} tasks total.`;
    default:               return "Done!";
  }
}

export const useJarvis = () => {
  const [messages, setMessages] = useState<JarvisMessage[]>([]);
  const [status, setStatus] = useState<JarvisStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const lastRequestAt = useRef<number>(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const rateLimitCount = useRef<number>(0); // tracks consecutive 429s for backoff
  const messagesRef = useRef<JarvisMessage[]>([]); // always-current snapshot

  const { tasks, createTask, deleteTask, updateTask, setFilters, clearFilters, filters } = useTaskContext();
  const { setTheme } = useTheme();

  const taskManager = useMemo(() => createTaskManager(
    tasks,
    { addTask: createTask, deleteTask, updateTask, setFilters, setSort: (by: any) => setFilters(f => ({ ...f, sortBy: by })), clearFilters },
    { setTheme }
  ), [tasks, createTask, deleteTask, updateTask, setFilters, clearFilters, setTheme]);

  useEffect(() => {
    const loadHistory = async () => {
      const history = await getJarvisHistory();
      const trimmed = history.slice(-20);
      messagesRef.current = trimmed;
      setMessages(trimmed);
    };
    loadHistory();
  }, []);

  // Cleanup timer on unmount
  useEffect(() => () => {
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
  }, []);

  const startCooldown = useCallback((seconds: number) => {
    setCooldownSeconds(seconds);
    setStatus("cooldown");
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) {
          clearInterval(cooldownTimer.current!);
          cooldownTimer.current = null;
          setStatus("idle");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const appendMessage = useCallback(async (role: "user" | "assistant", content: string, functionCall?: any) => {
    const msg: JarvisMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: Date.now(),
      functionCall,
    };
    // Keep ref in sync so sendMessage always sees the latest messages
    messagesRef.current = [...messagesRef.current.slice(-19), msg];
    setMessages(messagesRef.current);
    await addJarvisMessage(msg);
    return msg;
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !functions) return;

    // Client-side rate limiting — enforce minimum gap between requests
    const now = Date.now();
    const elapsed = now - lastRequestAt.current;
    if (elapsed < MIN_INTERVAL_MS) {
      const waitSecs = Math.ceil((MIN_INTERVAL_MS - elapsed) / 1000);
      startCooldown(waitSecs);
      return;
    }

    setStatus("thinking");
    setError(null);
    lastRequestAt.current = Date.now();

    try {
      // Append user message first, then use the fresh ref for the API call
      await appendMessage("user", text);

      const jarvisFn = httpsCallable<{ messages: JarvisMessage[]; currentTasks: any[] }, any>(
        functions,
        "jarvis"
      );

      // Use messagesRef (always current) so we don't pass stale closure state
      const result = await jarvisFn({
        messages: messagesRef.current,
        currentTasks: tasks,
      });

      const { content, functionCall } = result.data;

      if (functionCall) {
        logger.info("Executing tool:", functionCall.name, functionCall.args);
        const executor = toolExecutors[functionCall.name];
        if (executor) {
          try {
            const toolResult = await executor(functionCall.args, taskManager);
            const narration = localNarrate(functionCall.name, functionCall.args, toolResult);
            await appendMessage("assistant", narration, functionCall);
          } catch (err: any) {
            logger.error("Tool execution failed:", err);
            await appendMessage("assistant", `I tried to ${functionCall.name}, but something went wrong. ${err.message}`);
          }
        } else {
          await appendMessage("assistant", "I tried to do something I don't know how to do yet.");
        }
      } else {
        await appendMessage("assistant", content);
      }

      // Reset backoff counter on success
      rateLimitCount.current = 0;
      setStatus("idle");
    } catch (err: any) {
      logger.error("Jarvis Error:", err);

      const isRateLimit =
        err?.message?.includes("rate_limited") ||
        err?.message?.includes("429") ||
        err?.code === "resource-exhausted";

      if (isRateLimit) {
        // Escalating backoff: 30s → 60s → 90s
        const backoffIdx = Math.min(rateLimitCount.current, RATE_LIMIT_COOLDOWNS.length - 1);
        const cooldownSec = RATE_LIMIT_COOLDOWNS[backoffIdx];
        rateLimitCount.current += 1;

        setError(`Rate limited — please wait ${cooldownSec}s.`);
        await appendMessage("assistant", `Jarvis is busy right now. I'll be ready again in ${cooldownSec} seconds.`);
        startCooldown(cooldownSec);
      } else {
        setError(err.message || "Something went wrong with Jarvis.");
        setStatus("error");
        await appendMessage("assistant", "I'm having trouble connecting right now. Please try again.");
      }
    }
  }, [tasks, appendMessage, taskManager, startCooldown]);

  const clearHistory = useCallback(async () => {
    await clearIDBHistory();
    setMessages([]);
  }, []);

  return {
    messages,
    status,
    error,
    cooldownSeconds,
    sendMessage,
    clearHistory,
    currentFilters: filters,
  };
};
