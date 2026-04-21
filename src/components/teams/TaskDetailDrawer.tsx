import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Flag, User, CheckCircle2, Circle, Trash2, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../ui/Button";
import { CommentThread } from "./CommentThread";
import type { TeamTask, TeamMember } from "../../types/team";

interface TaskDetailDrawerProps {
  task: TeamTask | null;
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  members: (TeamMember & { id: string })[];
  isManager: boolean;
  onUpdateStatus: (taskId: string, status: "pending" | "completed") => void;
  onDelete: (taskId: string) => void;
}

export function TaskDetailDrawer({
  task,
  isOpen,
  onClose,
  teamId,
  members,
  isManager,
  onUpdateStatus,
  onDelete,
}: TaskDetailDrawerProps) {
  if (!task) return null;

  const assignee = members.find(m => m.id === task.assignedTo);
  const manager = members.find(m => m.id === task.assignedBy);

  const priorityColors = {
    Low: "text-gold bg-gold/10",
    Medium: "text-accent bg-accent/10",
    High: "text-danger bg-danger/10",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-surface shadow-2xl z-[101] flex flex-col border-l border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="rounded-full h-10 w-10 p-0"
                >
                  <X size={20} />
                </Button>
                <span className="text-sm font-bold uppercase tracking-widest text-text-muted">Task Details</span>
              </div>
              <div className="flex items-center gap-2">
                {isManager && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-text-muted hover:text-danger"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this task?")) {
                        onDelete(task.id);
                        onClose();
                      }
                    }}
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
                {task.status === "completed" ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success rounded-full text-xs font-bold uppercase">
                    <CheckCircle2 size={14} />
                    Completed
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 text-warning rounded-full text-xs font-bold uppercase">
                    <Circle size={14} />
                    Pending
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-8">
                {/* Title and Description */}
                <h2 className="text-3xl font-bold text-text mb-4 leading-tight">
                  {task.title}
                </h2>
                <p className="text-text-muted mb-10 leading-relaxed">
                  {task.description || "No description provided."}
                </p>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-y-8 gap-x-4 mb-10 p-4 sm:p-6 bg-surface-elevated rounded-2xl border border-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                      <Flag size={12} />
                      Priority
                    </div>
                    <div className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                      <Calendar size={12} />
                      Due Date
                    </div>
                    <div className="text-sm font-medium text-text">
                      {task.dueDate ? format(new Date(task.dueDate), "PPP") : "No due date"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                      <User size={12} />
                      Assignee
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center overflow-hidden">
                        <User size={12} className="text-text-muted" />
                      </div>
                      <span className="text-sm font-medium text-text">
                        {assignee?.displayName || "Unassigned"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                      <ChevronRight size={12} />
                      Source
                    </div>
                    <div className="text-sm font-medium text-text text-wrap break-words">
                      Created by {manager?.displayName || "Team"}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mb-12">
                   <Button 
                    className="flex-1"
                    onClick={() => onUpdateStatus(task.id, task.status === "completed" ? "pending" : "completed")}
                  >
                    {task.status === "completed" ? "Mark Pending" : "Mark Completed"}
                  </Button>
                </div>

                {/* Comments Section */}
                <div className="space-y-6 flex flex-col h-[400px] sm:h-[500px]">
                  <h3 className="text-lg font-bold text-text flex items-center gap-2">
                    Discussion
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-border rounded text-[10px] text-text-muted font-mono">
                      New
                    </span>
                  </h3>
                  <div className="flex-1 min-h-0">
                    <CommentThread teamId={teamId} taskId={task.id} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
