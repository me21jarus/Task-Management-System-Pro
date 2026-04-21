import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import Groq from "groq-sdk";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Llama 4 Scout — faster, multimodal-ready, available on Groq
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const TOOLS: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "addTask",
      description: "Create a new task in the user's personal dashboard",
      parameters: {
        type: "object",
        properties: {
          title:       { type: "string", description: "The title of the task" },
          description: { type: "string", description: "Optional description" },
          priority:    { type: "string", enum: ["Low", "Medium", "High"], description: "Default is Medium" },
          dueDate:     { type: "string", description: "ISO date string e.g. 2024-04-22" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "deleteTask",
      description: "Remove an existing task by title or ID",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Task title or ID to delete" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "markComplete",
      description: "Mark a task as completed",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Task title or ID" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "markIncomplete",
      description: "Mark a task as pending/incomplete",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Task title or ID" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "updateTask",
      description: "Update an existing task's title, description, priority, dueDate, or status",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Task title or ID to update" },
          updates: {
            type: "object",
            properties: {
              title:       { type: "string" },
              description: { type: "string" },
              priority:    { type: "string", enum: ["Low", "Medium", "High"] },
              dueDate:     { type: "string" },
              status:      { type: "string", enum: ["pending", "completed"] }
            }
          }
        },
        required: ["query", "updates"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "filterTasks",
      description: "Filter tasks by priority, status, or date range. Omit optional fields that are not specified; never send empty strings.",
      parameters: {
        type: "object",
        properties: {
          priority: { type: "string", enum: ["Low", "Medium", "High"] },
          status:   { type: "string", enum: ["pending", "completed"] },
          dateFrom: { type: "string" },
          dateTo:   { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "sortTasks",
      description: "Sort tasks by a field",
      parameters: {
        type: "object",
        properties: {
          by: { type: "string", enum: ["priority", "dueDate", "name", "createdAt"] }
        },
        required: ["by"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "clearFilters",
      description: "Clear all active task filters and show all tasks",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "searchTasks",
      description: "Search tasks by a text query",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getTasksSummary",
      description: "Get a summary of the user's current tasks and their status counts",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "switchTheme",
      description: "Switch the app between light and dark mode",
      parameters: {
        type: "object",
        properties: {
          theme: { type: "string", enum: ["light", "dark"] }
        },
        required: ["theme"]
      }
    }
  }
];

function normalizeToolArgs(value: any): any {
  if (Array.isArray(value)) {
    return value.map(normalizeToolArgs);
  }

  if (value && typeof value === "object") {
    if ("value" in value && "type" in value && Object.keys(value).length <= 2) {
      return normalizeToolArgs(value.value);
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, normalizeToolArgs(nestedValue)])
    );
  }

  return value;
}

function isToolValidationFailure(error: any): boolean {
  const message = String(error?.message ?? "").toLowerCase();
  return (
    message.includes("tool call validation failed") ||
    message.includes("tool_use_failed") ||
    message.includes("parameters for tool")
  );
}

async function createJarvisCompletion(
  groq: Groq,
  messages: Groq.Chat.ChatCompletionMessageParam[],
  extraInstruction?: string
) {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: extraInstruction
      ? [
          ...messages,
          {
            role: "system",
            content: extraInstruction,
          },
        ]
      : messages,
    tools: TOOLS,
    tool_choice: "auto",
    max_tokens: 512,
    temperature: extraInstruction ? 0 : 0.1,
  });

  return completion;
}

export const jarvis = onCall({
  cors: true,
  maxInstances: 10,
}, async (request) => {
  logger.info(`Jarvis invoked with model: ${GROQ_MODEL}`);

  // 1. Auth check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { messages, currentTasks } = request.data;
  if (!messages || !Array.isArray(messages)) {
    throw new HttpsError("invalid-argument", "Messages must be an array.");
  }

  // 2. Load API Key
  const apiKey = process.env.GROQ_API_KEY || process.env.groq_api_key;
  if (!apiKey) {
    logger.error("GROQ_API_KEY is not set in environment variables");
    throw new HttpsError("failed-precondition", "Jarvis brain is not configured. (Missing API Key)");
  }

  try {
    const groq = new Groq({ apiKey });

    // 3. Build task context
    const taskSummary = (currentTasks || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ?? null,
    }));

    const systemPrompt = `You are Jarvis, a concise task management assistant for TMS Pro.
Be brief and action-oriented. Use the provided tools to manage the user's tasks.
Today is ${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
Current tasks: ${JSON.stringify(taskSummary)}
After any action, give a short confirmation. Keep responses under 2 sentences.
Return tool arguments as plain JSON values only. Do not wrap fields in objects like {"type":"string","value":"..."}.
If a tool field is optional and you do not know its value, omit that field completely.
Never send empty strings for enum or date fields.
Never return JSON schema metadata such as "type", "properties", "required", "description", or "enum" as parameter values.
Example addTask call: {"title":"Review sales report","priority":"High","dueDate":"2026-04-21"}.
Example filterTasks call: {"status":"pending","dateFrom":"2026-04-21","dateTo":"2026-04-21"}.`;

    // 4. Build message history in OpenAI format (Groq is OpenAI-compatible)
    const chatMessages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages
        .filter((m: any) => m?.content?.trim())
        .map((m: any) => ({
          role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
          content: m.content as string,
        }))
    ];

    // 5. Call Groq
    let completion;
    try {
      completion = await createJarvisCompletion(groq, chatMessages);
    } catch (error: any) {
      if (!isToolValidationFailure(error)) {
        throw error;
      }

      logger.warn("Retrying malformed tool call with stricter instruction", {
        message: error?.message,
      });

      completion = await createJarvisCompletion(
        groq,
        chatMessages,
        `Your previous tool call was invalid because you returned schema-like objects instead of concrete values.
Return exactly one valid tool call if a tool is needed.
Use only plain JSON primitive values and arrays/objects of actual values.
Do not include schema keys like "type", "properties", "required", "description", or "enum".
For addTask, "title" must be a real task title string, "priority" must be "Low", "Medium", or "High", and "dueDate" must be an ISO date string only when known.`
      );
    }

    const choice = completion.choices[0];
    const responseMessage = choice.message;

    logger.info("Groq finish_reason:", choice.finish_reason);

    // 6. Check for tool calls
    if (
      choice.finish_reason === "tool_calls" &&
      responseMessage.tool_calls &&
      responseMessage.tool_calls.length > 0
    ) {
      const toolCall = responseMessage.tool_calls[0];
      let parsedArgs: Record<string, any> = {};
      try {
        parsedArgs = JSON.parse(toolCall.function.arguments || "{}");
        parsedArgs = normalizeToolArgs(parsedArgs);
      } catch {
        logger.warn("Failed to parse tool args:", toolCall.function.arguments);
      }

      return {
        role: "assistant",
        content: responseMessage.content ?? "",
        functionCall: {
          name: toolCall.function.name,
          args: parsedArgs,
        },
      };
    }

    // 7. Plain text response
    return {
      role: "assistant",
      content: responseMessage.content ?? "I'm not sure how to respond to that.",
    };

  } catch (error: any) {
    logger.error("Jarvis Execution Error:", error);

    const msg: string = error?.message ?? "";
    const status: number = error?.status ?? 0;

    const isRateLimit =
      status === 429 ||
      msg.includes("429") ||
      msg.toLowerCase().includes("rate_limit") ||
      msg.toLowerCase().includes("rate limit");

    if (isRateLimit) {
      throw new HttpsError("resource-exhausted", "rate_limited");
    }

    if (status === 401 || msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("invalid api")) {
      throw new HttpsError("permission-denied", "Invalid Groq API Key. Please check your configuration.");
    }

    throw new HttpsError("internal", msg || "Jarvis had a glitch. Please try again.");
  }
});
