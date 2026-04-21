import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Calendar as CalendarIcon, 
  ChevronUp, 
  ChevronDown 
} from "lucide-react";
import { cn } from "../../lib/utils";
import { CalendarWidget } from "../calendar/CalendarWidget";
import { useTaskContext } from "../../contexts/TaskContext";
import { JarvisPanel } from "../jarvis/JarvisPanel";


export function RightRail() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isJarvisOpen, setIsJarvisOpen] = useState(false);
  
  // Desktop collapse states
  const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(false);
  const [isJarvisCollapsed, setIsJarvisCollapsed] = useState(false);

  // Resizability
  const [railWidth, setRailWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);

  // Vertical Resizability
  const [calendarHeight, setCalendarHeight] = useState(
    typeof window !== 'undefined' ? (window.innerHeight - 160) / 2 : 340
  );
  const [, setIsResizingVertical] = useState(false);

  const { tasks, filters, setFilters } = useTaskContext();

  const handleDateSelect = (date?: string) => {
    setFilters(prev => ({
      ...prev,
      dateFrom: date,
      dateTo: date
    }));
  };

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = railWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Calculate new width (dragging left increases width)
      const newWidth = startWidth + (startX - moveEvent.clientX);
      if (newWidth >= 300 && newWidth <= 600) {
        setRailWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const startResizingVertical = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingVertical(true);
    const startY = e.clientY;
    const startHeight = calendarHeight;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newHeight = startHeight + (moveEvent.clientY - startY);
      if (newHeight >= 150 && newHeight <= 500) setCalendarHeight(newHeight);
    };
    const onMouseUp = () => {
      setIsResizingVertical(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <>
      {/* ── Desktop Right Rail (≥1024px) ── */}
      <motion.aside
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: railWidth }}
        className={cn(
          "hidden lg:flex flex-col relative",
          "h-full overflow-hidden",
          "px-4 py-6 gap-4",
          "border-l border-border bg-bg/50 backdrop-blur-sm transition-[background-color]",
          isResizing && "bg-surface-elevated border-primary/30"
        )}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={startResizing}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-50 group",
            "hover:bg-primary/50 transition-colors"
          )}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-border group-hover:bg-primary transition-colors rounded-full" />
        </div>

        {/* Calendar Section */}
        <div 
          className={cn(
            "flex flex-col transition-all duration-300 ease-in-out",
            isCalendarCollapsed ? "h-[40px] flex-shrink-0" : "flex-shrink-0"
          )}
          style={{ height: isCalendarCollapsed ? 40 : calendarHeight }}
        >
          <div className="flex items-center justify-between mb-3 flex-shrink-0 px-1">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <CalendarIcon size={14} />
              Calendar
            </p>
            <button 
              onClick={() => setIsCalendarCollapsed(!isCalendarCollapsed)}
              className="p-1 hover:bg-surface-elevated rounded transition-colors text-text-muted hover:text-primary"
            >
              {isCalendarCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
          <AnimatePresence>
            {!isCalendarCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto pr-1 scrollbar-hide"
              >
                <CalendarWidget 
                  tasks={tasks} 
                  selectedDate={filters.dateFrom === filters.dateTo ? filters.dateFrom : undefined}
                  onDateSelect={handleDateSelect}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Vertical Resize Handle */}
        {!isCalendarCollapsed && !isJarvisCollapsed && (
          <div
            onMouseDown={startResizingVertical}
            className="h-4 -my-2 flex items-center justify-center cursor-row-resize z-[60] group relative"
          >
            <div className="w-12 h-1 bg-border group-hover:bg-primary transition-colors rounded-full" />
          </div>
        )}
        
        {(isCalendarCollapsed || isJarvisCollapsed) && (
           <div className="h-px bg-border flex-shrink-0 my-2" />
        )}

        {/* AI Assistant Section */}
        <div className={cn(
          "flex flex-col transition-all duration-300 ease-in-out min-h-0",
          isJarvisCollapsed ? "h-[40px] flex-shrink-0" : "flex-1"
        )}>
          <div className="flex items-center justify-between mb-3 flex-shrink-0 px-1">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <MessageSquare size={14} />
              AI Assistant
            </p>
            <button 
              onClick={() => setIsJarvisCollapsed(!isJarvisCollapsed)}
              className="p-1 hover:bg-surface-elevated rounded transition-colors text-text-muted hover:text-primary"
            >
              {isJarvisCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
          <motion.div 
            animate={{ opacity: isJarvisCollapsed ? 0 : 1, y: isJarvisCollapsed ? -10 : 0 }}
            className={cn("flex-1 min-h-0", isJarvisCollapsed && "pointer-events-none")}
          >
            <JarvisPanel />
          </motion.div>
        </div>
      </motion.aside>

      {/* ── Mobile Overlays (<1024px) ── */}
      <div className="lg:hidden">
        {/* Floating Action Button for Jarvis */}
        <div className="fixed bottom-24 right-4 z-40">
          <motion.button
            onClick={() => setIsJarvisOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center cursor-pointer"
            aria-label="Open Jarvis AI"
          >
            <MessageSquare size={24} />
          </motion.button>
        </div>

        {/* Bottom Bar for Calendar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border px-4 py-3 flex items-center justify-center shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <motion.button
            onClick={() => setIsCalendarOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary transition-colors cursor-pointer"
          >
            <CalendarIcon size={16} />
            <span>Open Calendar</span>
            <ChevronUp size={16} className="text-primary" />
          </motion.button>
        </div>

        {/* Calendar Bottom Sheet */}
        <AnimatePresence>
          {isCalendarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCalendarOpen(false)}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
              />
              {/* Sheet */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-bg border-t border-border rounded-t-3xl p-6 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] overflow-hidden"
              >
                <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-text flex items-center gap-2">
                    <CalendarIcon size={18} className="text-primary" />
                    Calendar
                  </h3>
                  <button
                    onClick={() => setIsCalendarOpen(false)}
                    className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-primary hover:bg-primary-soft cursor-pointer transition-colors"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
                <CalendarWidget 
                  tasks={tasks} 
                  selectedDate={filters.dateFrom === filters.dateTo ? filters.dateFrom : undefined}
                  onDateSelect={handleDateSelect}
                />
                <div className="h-4" />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Jarvis Chat Overlay */}
        <AnimatePresence>
          {isJarvisOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsJarvisOpen(false)}
                className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]"
              />
              {/* Panel */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="fixed bottom-24 right-4 z-50 w-[calc(100%-32px)] max-w-[340px] bg-bg border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="bg-surface border-b border-border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center">
                      <MessageSquare size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text">Jarvis</p>
                      <p className="text-[10px] text-text-muted font-medium">Assistant</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsJarvisOpen(false)}
                    className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-primary hover:bg-primary-soft cursor-pointer transition-colors"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
                <div className="p-4">
                  <JarvisPanel />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
