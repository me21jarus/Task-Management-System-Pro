import { Task, PartialTask } from "../types/task";

export interface TaskManager {
  addTask: (params: { title: string; description?: string; priority?: string; dueDate?: string }) => Promise<Task>;
  deleteTask: (query: string) => Promise<string>; // Returns confirmation message or list for ambiguity
  markComplete: (query: string) => Promise<string>;
  markIncomplete: (query: string) => Promise<string>;
  updateTask: (query: string, updates: PartialTask) => Promise<string>;
  filterTasks: (filters: { priority?: string; status?: string; dateFrom?: string; dateTo?: string }) => Promise<string>;
  sortTasks: (by: string) => Promise<string>;
  clearFilters: () => Promise<string>;
  searchTasks: (query: string) => Promise<string>;
  getTasksSummary: () => Promise<Task[]>;
  switchTheme: (theme: "light" | "dark") => Promise<string>;
}

export const createTaskManager = (
  tasks: Task[],
  mutations: {
    addTask: (task: any) => Promise<Task>;
    deleteTask: (id: string) => Promise<void>;
    updateTask: (id: string, updates: PartialTask) => Promise<void>;
    setFilters: (filters: any) => void;
    setSort: (sort: any) => void;
    clearFilters: () => void;
  },
  theme: {
    setTheme: (theme: "light" | "dark") => void;
  }
): TaskManager => {
  const findTask = (query: string) => {
    const q = query.toLowerCase();
    // First try exact ID match if it looks like a UUID
    const taskById = tasks.find(t => t.id === query);
    if (taskById) return [taskById];

    // Then substring match on title
    const matches = tasks.filter(t => t.title.toLowerCase().includes(q));
    return matches;
  };

  const handleTaskQuery = async (
    query: string,
    action: (task: Task) => Promise<void>,
    actionName: string
  ): Promise<string> => {
    const matches = findTask(query);
    if (matches.length === 0) {
      return `I couldn't find any task matching "${query}".`;
    }
    if (matches.length > 1) {
      const titles = matches.map(m => `"${m.title}"`).join(", ");
      return `I found multiple tasks matching "${query}": ${titles}. Which one did you mean?`;
    }
    const task = matches[0];
    await action(task);
    return `Successfully ${actionName} task: "${task.title}".`;
  };

  return {
    addTask: async (params) => {
      const task = await mutations.addTask({
        title: params.title,
        description: params.description || "",
        priority: (params.priority as any) || "Medium",
        dueDate: params.dueDate,
      });
      return task;
    },
    deleteTask: async (query) => {
      return handleTaskQuery(query, (t) => mutations.deleteTask(t.id), "deleted");
    },
    markComplete: async (query) => {
      return handleTaskQuery(query, (t) => mutations.updateTask(t.id, { status: "completed" }), "completed");
    },
    markIncomplete: async (query) => {
      return handleTaskQuery(query, (t) => mutations.updateTask(t.id, { status: "pending" }), "marked as pending");
    },
    updateTask: async (query, updates) => {
      return handleTaskQuery(query, (t) => mutations.updateTask(t.id, updates), "updated");
    },
    filterTasks: async (filters) => {
      mutations.setFilters(filters);
      return `Filters applied: ${Object.entries(filters)
        .filter(([_, v]) => !!v)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}.`;
    },
    sortTasks: async (by) => {
      mutations.setSort(by);
      return `Sorted tasks by ${by}.`;
    },
    clearFilters: async () => {
      mutations.clearFilters();
      return "All filters cleared.";
    },
    searchTasks: async (query) => {
      mutations.setFilters({ search: query });
      return `Searching for "${query}".`;
    },
    getTasksSummary: async () => {
      return tasks;
    },
    switchTheme: async (newTheme) => {
      theme.setTheme(newTheme);
      return `Switched to ${newTheme} mode.`;
    },
  };
};
