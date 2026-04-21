import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings2, 
  SortAsc, 
  SortDesc, 
  RefreshCw
} from "lucide-react";
import { type FilterState, type Task } from "../../types/task";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

interface FilterPanelProps {
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function FilterPanel({ filters, onApply, onClear, isOpen, onToggle }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.priority && filters.priority.length > 0) count++;
    if (filters.status && filters.status !== "all") count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.sortBy && filters.sortBy !== "createdAt") count++;
    return count;
  }, [filters]);

  const togglePriority = (p: Task["priority"]) => {
    setLocalFilters(prev => {
      const current = prev.priority || [];
      const updated = current.includes(p)
        ? current.filter(x => x !== p)
        : [...current, p];
      return { ...prev, priority: updated };
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onToggle();
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Toggle Button was here in user's concept, but I'll make it reusable */}
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border",
            isOpen || activeCount > 0
              ? "bg-primary-soft border-primary/30 text-primary shadow-sm"
              : "bg-surface border-border text-text hover:bg-surface-elevated"
          )}
        >
          <Settings2 size={18} />
          <span>Filter</span>
          {activeCount > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-full mt-3 z-50 w-[90vw] md:w-[600px] lg:w-[800px]"
          >
            <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Priority */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Priority</label>
                  <div className="flex flex-wrap gap-2">
                    {(["Low", "Medium", "High"] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => togglePriority(p)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                          localFilters.priority?.includes(p)
                            ? {
                                Low: "bg-gold/10 border-gold text-gold",
                                Medium: "bg-accent/10 border-accent text-accent",
                                High: "bg-primary/10 border-primary text-primary",
                              }[p]
                            : "bg-surface border-border text-text-muted hover:border-text-muted/40"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Status</label>
                  <div className="flex p-1 bg-surface-elevated rounded-xl border border-border">
                    {["all", "pending", "completed", "team"].map(s => (
                      <button
                        key={s}
                        onClick={() => setLocalFilters(prev => ({ ...prev, status: s as any }))}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                          localFilters.status === s
                            ? "bg-surface shadow-sm text-text"
                            : "text-text-muted hover:text-text/70"
                        )}
                      >
                        {s === "team" ? "Teams" : s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Sort By</label>
                  <div className="flex gap-2">
                    <select
                      value={localFilters.sortBy}
                      onChange={(e) => setLocalFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                      className="flex-1 bg-surface-elevated border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="createdAt">Created Date</option>
                      <option value="dueDate">Due Date</option>
                      <option value="priority">Priority</option>
                      <option value="name">Alpha Name</option>
                    </select>
                    <button
                      onClick={() => setLocalFilters(prev => ({ ...prev, sortDirection: prev.sortDirection === "asc" ? "desc" : "asc" }))}
                      className="p-1.5 bg-surface-elevated border border-border rounded-xl text-text-muted hover:text-primary transition-colors"
                    >
                      {localFilters.sortDirection === "asc" ? <SortAsc size={16} /> : <SortDesc size={16} />}
                    </button>
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Date Range</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-text-muted w-8 shrink-0">From</span>
                       <input
                         type="date"
                         value={localFilters.dateFrom || ""}
                         onChange={(e) => setLocalFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                         className="flex-1 bg-surface-elevated border border-border rounded-xl px-2 py-1.5 text-[10px] font-bold focus:outline-none"
                       />
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-text-muted w-8 shrink-0">To</span>
                       <input
                         type="date"
                         value={localFilters.dateTo || ""}
                         onChange={(e) => setLocalFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                         className="flex-1 bg-surface-elevated border border-border rounded-xl px-2 py-1.5 text-[10px] font-bold focus:outline-none"
                       />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-border">
                <Button variant="ghost" size="sm" onClick={onClear} className="text-xs text-text-muted hover:text-danger gap-1.5">
                  <RefreshCw size={14} />
                  Clear All
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={onToggle} className="text-xs">
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleApply} className="text-xs px-6">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

