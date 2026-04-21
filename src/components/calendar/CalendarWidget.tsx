import { useState, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO
} from "date-fns";
import { cn } from "../../lib/utils";
import { type Task } from "../../types/task";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const CalendarDay = memo(({ day, dayStr, isCurrentToday, inMonth, isSel, tasksOnDay, onDateSelect }: {
  day: Date;
  dayStr: string;
  isCurrentToday: boolean;
  inMonth: boolean;
  isSel: boolean;
  tasksOnDay: { pending: boolean; completed: boolean } | undefined;
  onDateSelect: (date?: string) => void;
}) => {
  return (
    <div className="relative py-1">
      <motion.button
        whileHover={inMonth ? { scale: 1.1 } : {}}
        whileTap={inMonth ? { scale: 0.95 } : {}}
        onClick={() => inMonth && onDateSelect(isSel ? undefined : dayStr)}
        className={cn(
          "relative mx-auto flex items-center justify-center",
          "w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200",
          isSel
            ? "bg-primary text-white shadow-lg shadow-primary/25 z-10"
            : isCurrentToday
            ? "bg-primary-soft text-primary ring-2 ring-primary/20"
            : inMonth
            ? "text-text hover:bg-surface-elevated hover:text-primary"
            : "text-text-muted/20 pointer-events-none"
        )}
        title={dayStr}
      >
        {format(day, "d")}
      </motion.button>

      {/* Task Dots */}
      {inMonth && tasksOnDay && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-0.5 pointer-events-none">
          {tasksOnDay.pending && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          )}
          {!tasksOnDay.pending && tasksOnDay.completed && (
            <span className="w-1.5 h-1.5 rounded-full bg-border" />
          )}
        </div>
      )}
    </div>
  );
});

interface CalendarWidgetProps {
  tasks: Task[];
  selectedDate?: string;
  onDateSelect: (date?: string) => void;
}

export function CalendarWidget({ tasks, selectedDate, onDateSelect }: CalendarWidgetProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [direction, setDirection] = useState(0); // For slide animation
  const today = new Date();

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  // Map tasks to dates for quick lookup
  const taskMap = useMemo(() => {
    const map: Record<string, { pending: boolean; completed: boolean }> = {};
    tasks.forEach(t => {
      if (!t.dueDate) return;
      const d = t.dueDate.split("T")[0];
      if (!map[d]) map[d] = { pending: false, completed: false };
      if (t.status === "pending") map[d].pending = true;
      else map[d].completed = true;
    });
    return map;
  }, [tasks]);

  const handleMonthChange = (offset: number) => {
    setDirection(offset);
    setViewDate(prev => offset > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const selectedDateObj = selectedDate ? parseISO(selectedDate) : null;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 30 : -30,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -30 : 30,
      opacity: 0,
    }),
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-sm overflow-hidden">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => handleMonthChange(-1)}
          className={cn(
            "w-9 h-9 flex items-center justify-center rounded-xl",
            "text-text-muted hover:text-text hover:bg-surface-elevated transition-all border border-transparent hover:border-border"
          )}
        >
          <ChevronLeft size={18} />
        </button>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={viewDate.getMonth() + "-" + viewDate.getFullYear()}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm font-bold text-text flex items-center gap-1.5"
          >
            {format(viewDate, "MMMM yyyy")}
          </motion.div>
        </AnimatePresence>

        <button
          onClick={() => handleMonthChange(1)}
          className={cn(
            "w-9 h-9 flex items-center justify-center rounded-xl",
            "text-text-muted hover:text-text hover:bg-surface-elevated transition-all border border-transparent hover:border-border"
          )}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map((d) => (
          <span key={d} className="text-center text-[10px] font-black text-text-muted/60 uppercase py-1">
            {d}
          </span>
        ))}
      </div>

      {/* Day cells */}
      <motion.div 
        layout
        className="grid grid-cols-7 gap-y-1"
      >
        {days.map((day) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const isCurrentToday = isSameDay(day, today);
          const inMonth = isSameMonth(day, viewDate);
          const isSel = selectedDateObj && isSameDay(day, selectedDateObj);
          const tasksOnDay = taskMap[dayStr];

          return (
            <CalendarDay 
              key={day.toISOString()}
              day={day}
              dayStr={dayStr}
              isCurrentToday={isCurrentToday}
              inMonth={inMonth}
              isSel={!!isSel}
              tasksOnDay={tasksOnDay}
              onDateSelect={onDateSelect}
            />
          );
        })}
      </motion.div>

      {/* Clear date link */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-3 border-t border-border flex justify-center"
          >
            <button
              onClick={() => onDateSelect(undefined)}
              className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
            >
              Clear date filter
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
