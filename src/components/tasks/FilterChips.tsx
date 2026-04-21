import { useMemo, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { type FilterState } from "../../types/task";
import { cn } from "../../lib/utils";

interface FilterChipsProps {
  filters: FilterState;
  onRemove: (key: keyof FilterState, value?: any) => void;
  onClearAll: () => void;
}

export function FilterChips({ filters, onRemove, onClearAll }: FilterChipsProps) {
  const hasFilters = useMemo(() => {
    return (
      (filters.priority && filters.priority.length > 0) ||
      (filters.status && filters.status !== "all") ||
      (filters.search && filters.search.length > 0) ||
      filters.dateFrom ||
      filters.dateTo
    );
  }, [filters]);

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <AnimatePresence mode="popLayout">
        {/* Priority Chips */}
        {filters.priority?.map(p => (
          <Chip 
            key={`priority-${p}`}
            label={`Priority: ${p}`}
            onRemove={() => onRemove("priority", p)}
            variant={p}
          />
        ))}

        {/* Status Chip */}
        {filters.status && filters.status !== "all" && (
          <Chip 
            key={`status-${filters.status}`}
            label={`Status: ${filters.status}`}
            onRemove={() => onRemove("status")}
            variant="default"
          />
        )}

        {/* Date Range Chip */}
        {(filters.dateFrom || filters.dateTo) && (
          <Chip 
            key={`date-range-${filters.dateFrom}-${filters.dateTo}`}
            label={`Date: ${filters.dateFrom ? format(parseISO(filters.dateFrom), "MMM d") : "..."} - ${filters.dateTo ? format(parseISO(filters.dateTo), "MMM d") : "..."}`}
            onRemove={() => { onRemove("dateFrom"); onRemove("dateTo"); }}
            variant="default"
          />
        )}

        {/* Search Chip */}
        {filters.search && (
          <Chip 
             key={`search-${filters.search}`}
            label={`Search: "${filters.search}"`}
            onRemove={() => onRemove("search")}
            variant="default"
          />
        )}

        {/* Clear All Link */}
        <motion.button
          key="clear-all"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClearAll}
          className="text-xs font-bold text-primary hover:underline px-2 py-1"
        >
          Clear all
        </motion.button>
      </AnimatePresence>
    </div>
  );
}

const Chip = forwardRef<HTMLDivElement, { label: string, onRemove: () => void, variant?: any }>(
  ({ label, onRemove, variant = "default" }, ref) => {
    const colorClasses = {
      default: "bg-surface-elevated border-border text-text-muted",
      Low: "bg-gold/10 border-gold/30 text-gold",
      Medium: "bg-accent/10 border-accent/30 text-accent",
      High: "bg-primary/10 border-primary/30 text-primary",
    };

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0.8, x: -10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.8, x: -10 }}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider",
          (colorClasses as any)[variant] || colorClasses.default
        )}
      >
        <span>{label}</span>
        <button 
          onClick={onRemove}
          className="p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X size={10} />
        </button>
      </motion.div>
    );
  }
);

Chip.displayName = "Chip";

