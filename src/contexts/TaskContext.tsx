import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { useTasks, type UseTasksReturn } from "../hooks/useTasks";
import { type Task, type FilterState } from "../types/task";
import { TaskModal } from "../components/tasks/TaskModal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { getSettings, updateSettings } from "../lib/db";

interface TaskContextType extends UseTasksReturn {
  openCreateModal: () => void;
  openEditModal: (task: Task) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  viewMode: "list" | "card";
  setViewMode: (mode: "list" | "card") => void;
  clearFilters: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    priority: [],
    sortBy: "createdAt",
    sortDirection: "desc"
  });
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  
  const taskHelpers = useTasks(filters);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Load last filters on mount
  useEffect(() => {
    async function loadSettings() {
      const settings = await getSettings();
      if (settings.lastFilters) {
        setFilters(settings.lastFilters);
      }
    }
    loadSettings();
  }, []);

  // Save filters on change
  useEffect(() => {
    updateSettings({ lastFilters: filters });
  }, [filters]);

  const openCreateModal = () => {
    setEditingTask(undefined);
    setIsTaskModalOpen(true);
  };

  // Keyboard shortcut Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        openCreateModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const promptDeleteTask = async (id: string) => {
    setTaskToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      priority: [],
      sortBy: "createdAt",
      sortDirection: "desc",
      search: ""
    });
  };

  const handleTaskSubmit = async (data: any) => {
    if (editingTask) {
      await taskHelpers.updateTask(editingTask.id, data);
    } else {
      await taskHelpers.createTask(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      await taskHelpers.deleteTask(taskToDelete);
      setTaskToDelete(null);
    }
  };

  const value = useMemo(() => ({
    ...taskHelpers,
    deleteTask: promptDeleteTask,
    openCreateModal,
    openEditModal,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    clearFilters
  }), [taskHelpers, filters, viewMode]);

  return (
    <TaskContext.Provider value={value}>
      {children}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={editingTask}
        onSubmit={handleTaskSubmit}
      />
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
      />
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
}
