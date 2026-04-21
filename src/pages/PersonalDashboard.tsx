import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, List, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import { useTaskContext } from "../contexts/TaskContext";
import { TaskList } from "../components/tasks/TaskList";
import { SearchBar } from "../components/tasks/SearchBar";
import { FilterPanel } from "../components/tasks/FilterPanel";
import { FilterChips } from "../components/tasks/FilterChips";
import { type FilterState } from "../types/task";

export default function PersonalDashboard() {
  const { 
    filteredTasks,
    loading, 
    filters, 
    setFilters, 
    viewMode, 
    setViewMode,
    openCreateModal,
    openEditModal,
    toggleComplete,
    deleteTask,
    updateTask,
    clearFilters
  } = useTaskContext();

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleRemoveFilter = (key: keyof FilterState, value?: any) => {
    setFilters(prev => {
      const next = { ...prev };
      if (key === "priority" && value) {
        next.priority = next.priority?.filter(p => p !== value);
      } else if (key === "dateFrom" || key === "dateTo") {
        delete next.dateFrom;
        delete next.dateTo;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const currentTitle = (({
    all: "My Tasks",
    pending: "Pending Tasks",
    completed: "Completed Tasks",
    team: "Team Assignments"
  }[filters.status || "all"]) || "My Tasks");

  return (
    <div className="max-w-4xl mx-auto xl:max-w-5xl px-4 sm:px-0">
      {/* ── Page heading + View Toggle ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6"
      >
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-text tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}>
            {currentTitle}
          </h1>
          <p className="text-xs font-medium text-text-muted/60 uppercase tracking-widest mt-1">
            Personal Dashboard • {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-center sm:justify-start bg-surface border border-border rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-bold",
              viewMode === "list" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text"
            )}
          >
            <List size={14} />
            <span>List</span>
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-bold",
              viewMode === "card" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:text-text"
            )}
          >
            <LayoutGrid size={14} />
            <span>Grid</span>
          </button>
        </div>
      </motion.div>

      {/* ── Search + Filter bar ── */}
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex gap-2 items-center">
          <SearchBar 
            value={filters.search || ""} 
            onSearch={handleSearch} 
          />
          <FilterPanel 
            filters={filters}
            isOpen={filterPanelOpen}
            onToggle={() => setFilterPanelOpen(!filterPanelOpen)}
            onApply={handleApplyFilters}
            onClear={clearFilters}
          />
        </div>
        
        {/* Active Filter Chips */}
        <FilterChips 
          filters={filters} 
          onRemove={handleRemoveFilter} 
          onClearAll={clearFilters} 
        />
      </div>

      {/* ── Task list area ── */}
      <div className="min-h-[400px] mt-2">
        <TaskList
          tasks={filteredTasks}
          viewMode={viewMode}
          filters={filters}
          loading={loading}
          onToggle={toggleComplete}
          onEdit={openEditModal}
          onDelete={deleteTask}
          onUpdateTask={updateTask}
          onCreateClick={openCreateModal}
          onClearFilters={clearFilters}
        />
      </div>

      {/* ── Floating Action Button (FAB) ── */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.9 }}
        onClick={openCreateModal}
        className={cn(
          "fixed z-40 cursor-pointer flex items-center justify-center",
          "w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30",
          "bottom-36 right-4 lg:bottom-12 lg:right-[380px] xl:right-[400px]" // Above mobile Jarvis, and right-bottom of middle page on desktop
        )}
        aria-label="Create new task"
      >
        <Plus size={24} strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
