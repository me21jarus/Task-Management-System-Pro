import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Paperclip, 
  Trash2, 
  Edit2,
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  AlertTriangle,
  Smile,
  X
} from "lucide-react";
import { format, isPast, isToday, parseISO } from "date-fns";
import confetti from "canvas-confetti";
import { type Task } from "../../types/task";
import { cn } from "../../lib/utils";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  viewMode?: "list" | "card";
}

export const TaskCard = memo(function TaskCard({ task, onToggle, onEdit, onDelete, onUpdateTask, viewMode = "list" }: TaskCardProps) {
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isCompleted = task.status === "completed";
  const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !isCompleted;

  const priorityColors = {
    Low: "bg-gold",
    Medium: "bg-accent",
    High: "bg-primary",
  };

  const priorityTextColors = {
    Low: "text-gold",
    Medium: "text-accent",
    High: "text-primary",
  };

  const prioritySoftColors = {
    Low: "bg-gold/10",
    Medium: "bg-accent/10",
    High: "bg-primary/10",
  };

  const isCard = viewMode === "card";

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  };

  const handleSelectEmoji = (e: React.MouseEvent, emoji: string) => {
    e.stopPropagation();
    if (onUpdateTask) {
      onUpdateTask(task.id, { emoji });
    }
    setShowEmojiPicker(false);
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -2, scale: 1.01 }}
      onDoubleClick={handleEdit}
      onClick={(e) => {
        if (window.innerWidth < 768) {
          handleEdit(e);
        }
      }}
      title="Double click to edit"
      className={cn(
        "group relative bg-surface border border-border rounded-xl transition-all duration-200 shadow-sm hover:shadow-md select-none cursor-pointer",
        isCompleted && "opacity-60",
        isCard ? "h-full flex flex-col" : "flex flex-col"
      )}
    >
      {/* Priority Stripe */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", priorityColors[task.priority])} />

      <div className={cn(
        "flex flex-col",
        !isCard 
          ? "p-2.5 sm:p-3.5 pl-4 sm:pl-5" 
          : "p-2.5 sm:p-3 pl-4 sm:pl-5 h-full"
      )}>
        <div className="flex items-start gap-2.5">
          {/* Checkbox */}
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isCompleted) {
                confetti({
                  particleCount: 50,
                  spread: 60,
                  colors: ['#C41230', '#E05A0A', '#C8A97E'],
                  origin: { y: 0.8 },
                  zIndex: 100
                });
              }
              onToggle(task.id); 
            }}
            className={cn(
              "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0",
              isCompleted
                ? "bg-primary border-primary text-white"
                : "border-border hover:border-primary/50 text-transparent"
            )}
          >
            <Check size={11} strokeWidth={3} className={cn(isCompleted ? "scale-100" : "scale-0 transition-transform")} />
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  {task.emoji && (
                     <span className="text-xl sm:text-2xl shrink-0 select-none drop-shadow-sm">{task.emoji}</span>
                  )}
                  <h3 className={cn(
                    "font-semibold text-text leading-tight transition-all duration-300 break-words min-w-0",
                    isCard ? "text-[13px] sm:text-[15px] line-clamp-1" : "text-base sm:text-lg line-clamp-1",
                    isCompleted && "line-through text-text-muted"
                  )}>
                    {task.title}
                  </h3>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleEdit}
                    className={cn(
                      "p-1 rounded-md text-text-muted transition-all duration-200",
                      "hover:bg-primary-soft hover:text-primary",
                      "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    )}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                    className={cn(
                      "p-1 rounded-md text-text-muted transition-all duration-200",
                      "hover:bg-danger/10 hover:text-danger",
                      "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    )}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Overdue Badge or Emoji Picker below actions */}
                <div className="relative">
                  {isOverdue ? (
                    <div className="flex flex-col items-center">
                      <div className="bg-danger/10 text-danger p-0.5 rounded-full animate-pulse" title="Overdue">
                        <AlertTriangle size={12} />
                      </div>
                    </div>
                  ) : (
                    !isCompleted && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}
                        className={cn(
                          "w-10 h-10 rounded-2xl border-2 border-border flex items-center justify-center transition-all duration-200",
                          "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:border-primary/50 hover:bg-primary-soft",
                          task.emoji ? "opacity-100 bg-primary-soft border-primary/20" : "bg-surface-elevated text-text-muted"
                        )}
                        title="Set Status Icon"
                      >
                        {task.emoji ? (
                          <span className="text-xl">{task.emoji}</span>
                        ) : (
                          <Smile size={20} />
                        )}
                      </button>
                    )
                  )}

                  {/* Emoji selection popup */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <>
                        <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(false); }} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          className="absolute right-0 bottom-full mb-3 z-[70] bg-surface/95 backdrop-blur-md border-2 border-primary/30 rounded-2xl shadow-2xl p-4 w-[220px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-[11px] font-black uppercase tracking-widest text-text-muted mb-4 px-1 flex items-center justify-between">
                            <span>Status icon</span>
                            <button onClick={() => setShowEmojiPicker(false)}><X size={14} /></button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            {[ "🎯", "🔥", "✨", "✅", "🚀" ].map(e => (
                              <button
                                key={e}
                                onClick={(event) => handleSelectEmoji(event, e)}
                                className={cn(
                                  "text-3xl flex items-center justify-center aspect-square rounded-xl transition-all duration-200",
                                  "hover:bg-primary-soft hover:scale-110 active:scale-95",
                                  task.emoji === e ? "bg-primary-soft ring-2 ring-primary/40 shadow-sm" : "bg-surface-elevated/50"
                                )}
                              >
                                {e}
                              </button>
                            ))}
                            
                            {/* Remove Option as 6th slot */}
                            <button
                              onClick={(event) => handleSelectEmoji(event, "")}
                              className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-xl border border-dashed aspect-square transition-all duration-200 group/remove",
                                !task.emoji ? "hidden" : "border-danger/30 hover:bg-danger/10 hover:border-danger/50"
                              )}
                              title="Remove Emoji"
                            >
                              <Trash2 size={20} className="text-danger/60 group-hover/remove:text-danger" />
                              <span className="text-[8px] font-bold text-danger mt-1">REMOVE</span>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {task.description && (
              <p className={cn(
                "mt-0.5 text-text-muted leading-relaxed",
                isCard ? "text-[10px] sm:text-xs line-clamp-1" : "text-sm line-clamp-1",
                isCompleted && "line-through"
              )}>
                {task.description}
              </p>
            )}

            <div className={cn(
              "mt-2 flex flex-wrap items-center gap-2.5",
              isCard && "mt-auto"
            )}>
              {/* Priority Pill */}
              <div className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                prioritySoftColors[task.priority],
                priorityTextColors[task.priority]
              )}>
                {task.priority}
              </div>

              {/* Due Date */}
              {task.dueDate && (
                <div className={cn(
                  "flex items-center gap-1.5 text-[10px] sm:text-xs font-medium",
                  isOverdue ? "text-danger" : "text-text-muted"
                )}>
                  <Calendar size={12} />
                  <span>{format(dueDate!, isCard ? "MMM d" : "MMM d, yyyy")}</span>
                </div>
              )}

              {/* Attachment Count */}
              {task.attachments.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAttachments(!showAttachments); }}
                  className={cn(
                    "flex items-center gap-1 text-[10px] sm:text-xs font-medium hover:text-primary transition-colors",
                    showAttachments ? "text-primary" : "text-text-muted"
                  )}
                >
                  <Paperclip size={12} />
                  <span>{task.attachments.length}</span>
                  {!isCard && (
                    <ChevronDown 
                      size={12} 
                      className={cn("transition-transform duration-200", showAttachments && "rotate-180")} 
                    />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Attachments Panel (List view only) */}
        {!isCard && (
          <AnimatePresence>
            {showAttachments && task.attachments.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="pt-4 border-t border-border space-y-2">
                  {task.attachments.map((att) => (
                    <div 
                      key={att.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated border border-border/40"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {att.type === "link" ? (
                          <ExternalLink size={14} className="text-text-muted shrink-0" />
                        ) : (
                          <FileText size={14} className="text-text-muted shrink-0" />
                        )}
                        <span className="text-xs font-medium text-text truncate">
                          {att.name}
                        </span>
                      </div>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="ml-2 px-2 py-1 rounded bg-surface border border-border text-[10px] font-bold text-primary hover:bg-primary-soft transition-colors"
                      >
                        OPEN
                      </a>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
});
