import { z } from "zod";
import { TaskManager } from "./task-manager";

// --- Tool Schemas ---

export const addTaskSchema = z.object({
  title: z.string().describe("The name of the task to create"),
  description: z.string().optional().describe("Optional detailed information about the task"),
  priority: z.enum(["Low", "Medium", "High"]).optional().describe("Task priority level (Low, Medium, or High)"),
  dueDate: z.string().optional().describe("ISO 8601 date string, e.g., '2025-04-21'")
});

export const deleteTaskSchema = z.object({
  query: z.string().describe("The title or ID of the task to delete")
});

export const markCompleteSchema = z.object({
  query: z.string().describe("The title or ID of the task to mark as completed")
});

export const markIncompleteSchema = z.object({
  query: z.string().describe("The title or ID of the task to mark as pending")
});

export const updateTaskSchema = z.object({
  query: z.string().describe("The title or ID of the task to update"),
  updates: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    priority: z.enum(["Low", "Medium", "High"]).optional(),
    dueDate: z.string().optional(),
    status: z.enum(["pending", "completed"]).optional()
  }).describe("Fields to update")
});

export const filterTasksSchema = z.object({
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  status: z.enum(["pending", "completed"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
});

export const sortTasksSchema = z.object({
  by: z.enum(["priority", "dueDate", "name", "createdAt"]).describe("Field to sort by")
});

export const searchTasksSchema = z.object({
  query: z.string().describe("The text to search for across all tasks")
});

export const switchThemeSchema = z.object({
  theme: z.enum(["light", "dark"]).describe("The theme to switch to")
});

// --- Jarvis Tool Definitions ---

export const jarvisTools = [
  {
    name: "addTask",
    description: "Create a new task in the user's personal dashboard. Use this when the user says something like 'Add a task to...' or 'Remind me to...'",
    parameters: addTaskSchema,
    examples: ["Add a high priority task to review the Q3 report due Friday", "Remind me to buy groceries", "Create a task 'Walk the dog' tomorrow"]
  },
  {
    name: "deleteTask",
    description: "Remove an existing task. Use when user says 'Delete...', 'Remove...', or 'Get rid of...'",
    parameters: deleteTaskSchema,
    examples: ["Delete the task 'Buy milk'", "Remove my meeting reminder"]
  },
  {
    name: "markComplete",
    description: "Mark a task as finished. Use when user says 'Mark... as done' or 'I finished...'",
    parameters: markCompleteSchema,
    examples: ["Mark shopping as done", "Completed the report review"]
  },
  {
    name: "markIncomplete",
    description: "Mark a task as not finished. Use when user says 'Uncheck...', 'Put... back', or 'I still need to...'",
    parameters: markIncompleteSchema,
    examples: ["I still need to do the laundry", "Mark the meeting as pending"]
  },
  {
    name: "updateTask",
    description: "Modify an existing task's details like title, description, priority, or due date.",
    parameters: updateTaskSchema,
    examples: ["Change the priority of 'Fix bug' to High", "Update the due date for the presentation to May 10th"]
  },
  {
    name: "filterTasks",
    description: "Filter shown tasks by their attributes.",
    parameters: filterTasksSchema,
    examples: ["Show only high priority tasks", "List my pending work"]
  },
  {
    name: "sortTasks",
    description: "Organize the task list by a specific attribute.",
    parameters: sortTasksSchema,
    examples: ["Sort by priority", "Order by due date", "Sort tasks by name"]
  },
  {
    name: "clearFilters",
    description: "Remove all active filters and search terms to show all tasks.",
    parameters: z.object({}),
    examples: ["Clear all filters", "Show everything", "Reset filters"]
  },
  {
    name: "searchTasks",
    description: "Global search for tasks by a text string.",
    parameters: searchTasksSchema,
    examples: ["Find tasks about 'report'", "Search for 'meeting'"]
  },
  {
    name: "getTasksSummary",
    description: "Get a summary of all current tasks. Use when user asks 'What's on my plate?', 'What do I have to do?', or 'List my tasks'.",
    parameters: z.object({}),
    examples: ["What's on my plate today?", "What are my pending tasks?", "Show me a summary of my work"]
  },
  {
    name: "switchTheme",
    description: "Toggle between light and dark mode.",
    parameters: switchThemeSchema,
    examples: ["Switch to dark mode", "Change to light theme", "Go dark"]
  }
];

// --- Tool Executors ---

export const toolExecutors: Record<string, (args: any, tm: TaskManager) => Promise<any>> = {
  addTask: async (args, tm) => {
    const task = await tm.addTask(args);
    return `Task "${task.title}" created successfully.`;
  },
  deleteTask: async (args, tm) => {
    return await tm.deleteTask(args.query);
  },
  markComplete: async (args, tm) => {
    return await tm.markComplete(args.query);
  },
  markIncomplete: async (args, tm) => {
    return await tm.markIncomplete(args.query);
  },
  updateTask: async (args, tm) => {
    return await tm.updateTask(args.query, args.updates);
  },
  filterTasks: async (args, tm) => {
    return await tm.filterTasks(args);
  },
  sortTasks: async (args, tm) => {
    return await tm.sortTasks(args.by);
  },
  clearFilters: async (_args, tm) => {
    return await tm.clearFilters();
  },
  searchTasks: async (args, tm) => {
    return await tm.searchTasks(args.query);
  },
  getTasksSummary: async (_args, tm) => {
    const tasks = await tm.getTasksSummary();
    if (tasks.length === 0) return "You have no tasks at the moment.";
    const pending = tasks.filter(t => t.status === "pending");
    const high = pending.filter(t => t.priority === "High");
    
    let summary = `You have ${tasks.length} total tasks. `;
    if (pending.length === 0) {
      summary += "All your tasks are completed!";
    } else {
      summary += `There are ${pending.length} pending tasks, including ${high.length} high-priority ones.`;
    }
    return { summary, tasks: pending };
  },
  switchTheme: async (args, tm) => {
    return await tm.switchTheme(args.theme);
  }
};
