import { useState, useEffect, useCallback, useMemo } from "react";
import { type Task, type FilterState } from "../types/task";
import { useToast } from "../contexts/ToastContext";
import * as db from "../lib/db";
import { logger } from "../lib/logger";
import { isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";

export interface UseTasksReturn {
  tasks: Task[]; // This will return ALL tasks for global counters
  filteredTasks: Task[]; // This will return only filtered tasks
  loading: boolean;
  error: Error | null;
  createTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "status"> & { status?: Task["status"] }) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTasks(filters?: FilterState): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const allTasks = await db.getAllTasks();
      const sanitizedTasks = allTasks.map(t => ({
        ...t,
        status: t.status || "pending"
      }));
      setTasks(sanitizedTasks);
      setError(null);
    } catch (err) {
      logger.error("Failed to fetch tasks", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch tasks"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Derived filtered tasks with memoization
  const filteredTasks = useMemo(() => {
    if (!filters) return [...tasks].sort((a, b) => b.createdAt - a.createdAt);

    let result = [...tasks];

    // Status Filter
    if (filters.status && filters.status !== "all") {
      if (filters.status === "team") {
        result = result.filter(t => !!t.teamId);
      } else {
        result = result.filter(t => t.status === filters.status);
      }
    }

    // Priority Filter (Multi-select)
    if (filters.priority && filters.priority.length > 0) {
      result = result.filter(t => filters.priority!.includes(t.priority));
    }

    // Search Filter (Title + Description)
    if (filters.search) {
      const query = filters.search.toLowerCase().trim();
      if (query) {
        result = result.filter(t =>
          t.title.toLowerCase().includes(query) ||
          (t.description ?? "").toLowerCase().includes(query)
        );
      }
    }

    // Date Range Filter
    if (filters.dateFrom || filters.dateTo) {
      result = result.filter(t => {
        if (!t.dueDate) return false;
        const taskDate = parseISO(t.dueDate);
        const start = filters.dateFrom ? startOfDay(parseISO(filters.dateFrom)) : new Date(0);
        const end = filters.dateTo ? endOfDay(parseISO(filters.dateTo)) : new Date(8640000000000000);
        return isWithinInterval(taskDate, { start, end });
      });
    }

    // Sorting
    const sortBy = filters.sortBy || "createdAt";
    const direction = filters.sortDirection || "desc";

    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "priority": {
          const priorityMap = { High: 3, Medium: 2, Low: 1 };
          comparison = priorityMap[a.priority] - priorityMap[b.priority];
          break;
        }
        case "dueDate": {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          comparison = a.dueDate.localeCompare(b.dueDate);
          break;
        }
        case "name":
          comparison = a.title.localeCompare(b.title);
          break;
        case "createdAt":
        default:
          comparison = a.createdAt - b.createdAt;
          break;
      }

      return direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [tasks, filters]);

  const createTask = async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt" | "status"> & { status?: Task["status"] }) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const newTask: Task = {
      ...taskData,
      description: taskData.description ?? "",
      status: "pending",
      attachments: taskData.attachments || [],
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.putTask(newTask);
      // Optimistic update: prepend immediately so UI is reactive
      setTasks(prev => [newTask, ...prev]);
      toast("Task created successfully", "success");
      return newTask;
    } catch (err) {
      logger.error("Failed to create task", err);
      toast("Failed to create task", "error");
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const now = Date.now();
    
    try {
      const existing = await db.getTask(id);
      if (!existing) throw new Error("Task not found");
      
      const updatedTask = { ...existing, ...updates, updatedAt: now };
      await db.putTask(updatedTask);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    } catch (err) {
      logger.error("Failed to update task", err);
      toast("Failed to update task", "error");
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await db.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast("Task deleted", "success");
    } catch (err) {
      logger.error("Failed to delete task", err);
      toast("Failed to delete task", "error");
      throw err;
    }
  };

  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === "pending" ? "completed" : "pending";
    await updateTask(id, { status: newStatus });
  };

  return {
    tasks,
    filteredTasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    refresh: fetchTasks,
  };
}
