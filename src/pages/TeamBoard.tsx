import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  UserPlus, 
  ArrowLeft,
  ExternalLink,
  Flag,
  MessageSquare
} from "lucide-react";
import { useTeam } from "../hooks/useTeam";
import { useAuth } from "../hooks/useAuth";
import { useTasks as usePersonalTasks} from "../hooks/useTasks";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Spinner } from "../components/ui/Spinner";
import { TaskDetailDrawer } from "../components/teams/TaskDetailDrawer";
import { MemberList } from "../components/teams/MemberList";
import type { TeamTask } from "../types/team";
import { format } from "date-fns";
import { logger } from "../lib/logger";

export default function TeamBoard() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    team, 
    tasks, 
    members, 
    loading, 
    error,
    isManager, 
    addTask, 
    updateTask, 
    deleteTask,
    inviteNewMember,
    removeTeamMember 
  } = useTeam(teamId);
  const { createTask: createPersonalTask } = usePersonalTasks();

  const [activeTab, setActiveTab] = useState<"tasks" | "my-tasks" | "members">("tasks");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium" as "Low" | "Medium" | "High",
    dueDate: "",
    assignedTo: "",
  });

  const selectedTask = useMemo(() => 
    tasks.find(t => t.id === selectedTaskId) || null, 
  [tasks, selectedTaskId]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    if (activeTab === "my-tasks" && user) {
      result = result.filter(t => t.assignedTo === user.uid);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [tasks, activeTab, user, searchQuery]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTask.title.trim() || !newTask.assignedTo) return;

    await addTask({
      ...newTask,
      status: "pending",
      assignedBy: user.uid,
      acceptedByUser: false,
      attachments: [],
    });

    setIsAddTaskModalOpen(false);
    setNewTask({
      title: "",
      description: "",
      priority: "Medium",
      dueDate: "",
      assignedTo: "",
    });
  };

  const handleAcceptTask = async (task: TeamTask) => {
    if (task.acceptedByUser) return;

    try {
      // 1. Copy to personal tasks (IndexedDB)
      await createPersonalTask({
        title: `[TEAM] ${task.title}`,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        status: "pending",
        attachments: task.attachments,
        sourceTaskId: task.id,
        teamId: teamId
      });

      // 2. Update Firestore
      await updateTask(task.id, { acceptedByUser: true });
    } catch (err) {
      logger.error("Failed to accept task:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg p-4 text-center">
        <h1 className="text-2xl font-bold mb-3">
          {error || "You are not added to any team yet."}
        </h1>
        <p className="text-text-muted max-w-md mb-6">
          Join or create a team first, then your team dashboard and assignments will appear here.
        </p>
        <Button onClick={() => navigate("/app/teams")}>Back to Teams</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header - Full Width */}
      <header className="bg-surface border-b border-border sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              to="/app/teams" 
              className="p-2 hover:bg-bg rounded-lg text-text-muted transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="h-8 w-[1px] bg-border" />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Users size={16} className="text-primary" />
                <h1 className="text-xl font-bold text-text">{team.name}</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {members.slice(0, 5).map((member) => (
                    <div 
                      key={member.id} 
                      className="group relative w-6 h-6 rounded-full bg-border border-2 border-surface flex items-center justify-center overflow-visible cursor-pointer"
                    >
                      <Users size={12} className="text-text-muted" />
                      
                      {/* Hover Tooltip Reveal */}
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all z-50">
                        <div className="bg-surface-elevated border border-border rounded-lg shadow-xl px-3 py-2 flex flex-col items-center whitespace-nowrap">
                          <p className="text-xs font-bold text-text">{member.displayName}</p>
                          <p className="text-[10px] text-text-muted uppercase tracking-wider">{member.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {members.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-border border-2 border-surface flex items-center justify-center text-[10px] font-bold text-text-muted">
                      +{members.length - 5}
                    </div>
                  )}
                </div>
                <span className="text-xs text-text-muted font-medium">
                  {members.length} members
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isManager && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hidden sm:flex gap-2"
                  onClick={() => setActiveTab("members")}
                >
                  <UserPlus size={16} />
                  <span>Manage Members</span>
                </Button>
                <Button 
                  size="sm" 
                  className="flex gap-2"
                  onClick={() => setIsAddTaskModalOpen(true)}
                >
                  <Plus size={16} />
                  <span>Create Task</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-8">
        {/* Tabs and Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex bg-surface p-1 rounded-xl border border-border w-fit">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "tasks" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-muted hover:text-text"
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setActiveTab("my-tasks")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "my-tasks" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-muted hover:text-text"
              }`}
            >
              Assigned to Me
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "members" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-muted hover:text-text"
              }`}
            >
              Members
            </button>
          </div>

          {activeTab !== "members" && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <Input
                placeholder="Search team tasks..."
                className="pl-10 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {activeTab === "members" ? (
          <MemberList 
            members={members} 
            isManager={isManager} 
            onInvite={inviteNewMember}
            onRemove={removeTeamMember}
            currentUserUid={user?.uid || ""}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg/50 border-b border-border">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-muted">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-muted">Task</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-muted">Priority</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-muted">Assignee</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-muted">Due Date</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-muted"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center">
                            <CheckCircle2 size={32} className="text-text-muted opacity-50" />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-text">No tasks found</p>
                            <p className="text-sm text-text-muted">Try adjusting your filters or search query.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const assignee = members.find(m => m.id === task.assignedTo);
                      const isAssignedToMe = task.assignedTo === user?.uid;
                      const canEditStatus = isManager || isAssignedToMe;

                      return (
                        <motion.tr 
                          key={task.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-bg/40 transition-colors group cursor-pointer"
                          onClick={() => setSelectedTaskId(task.id)}
                        >
                          <td className="px-6 py-4">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (canEditStatus) {
                                    updateTask(task.id, { 
                                      status: task.status === "completed" ? "pending" : "completed" 
                                    });
                                  }
                                }}
                                className={`p-1.5 rounded-full transition-all ${
                                  task.status === "completed" 
                                  ? "bg-success/10 text-success" 
                                  : "text-text-muted hover:bg-border"
                                }`}
                              >
                                {task.status === "completed" ? (
                                  <CheckCircle2 size={24} />
                                ) : (
                                  <Circle size={24} />
                                )}
                              </button>
                               {/* Mock notification dot */}
                               <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary border-2 border-surface rounded-full shadow-sm animate-pulse" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className={`font-bold transition-all ${task.status === "completed" ? "text-text-muted line-through" : "text-text"}`}>
                                  {task.title}
                                </p>
                                <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                                  {task.description || "No description"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                              task.priority === "High" ? "bg-danger/10 text-danger border-danger/20" :
                              task.priority === "Medium" ? "bg-accent/10 text-accent border-accent/20" :
                              "bg-gold/10 text-gold border-gold/20"
                            }`}>
                              <Flag size={10} />
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center overflow-hidden">
                                <Users size={14} className="text-text-muted" />
                              </div>
                              <span className="text-sm font-medium text-text">
                                {assignee?.displayName || "Unassigned"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-text-muted font-mono">
                            {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "-"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                             {(task.commentCount || 0) > 0 && (
                               <div className="flex items-center gap-1 text-primary text-xs font-bold mr-2">
                                <MessageSquare size={14} />
                                <span>{task.commentCount}</span>
                               </div>
                             )}
                              {isAssignedToMe && !task.acceptedByUser && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs font-bold gap-1.5 py-0 px-3 bg-primary/5 hover:bg-primary hover:text-white border-primary/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAcceptTask(task);
                                  }}
                                >
                                  <ExternalLink size={12} />
                                  Accept
                                </Button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskId(task.id);
                                }}
                                className="p-2 text-text-muted hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <ChevronRight size={20} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="bg-surface rounded-2xl border border-border p-12 text-center">
                  <p className="text-text-muted">No tasks found</p>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const assignee = members.find(m => m.id === task.assignedTo);
                  const isAssignedToMe = task.assignedTo === user?.uid;
                  const canEditStatus = isManager || isAssignedToMe;

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="bg-surface rounded-2xl border-2 border-border p-5 active:scale-[0.98] transition-all relative overflow-hidden"
                    >
                      {/* Priority left border indicator */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        task.priority === "High" ? "bg-danger" :
                        task.priority === "Medium" ? "bg-accent" :
                        "bg-gold"
                      }`} />

                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canEditStatus) {
                                updateTask(task.id, { 
                                  status: task.status === "completed" ? "pending" : "completed" 
                                });
                              }
                            }}
                            className={`mt-1 p-1 rounded-full transition-all ${
                              task.status === "completed" ? "text-success" : "text-text-muted"
                            }`}
                          >
                            {task.status === "completed" ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                          </button>
                          <div>
                            <h3 className={`font-bold text-lg leading-snug ${task.status === "completed" ? "text-text-muted line-through" : "text-text"}`}>
                              {task.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                task.priority === "High" ? "text-danger bg-danger/10" :
                                task.priority === "Medium" ? "text-accent bg-accent/10" :
                                "text-gold bg-gold/10"
                              }`}>
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <span className="text-[10px] text-text-muted font-mono flex items-center gap-1">
                                  <Calendar size={10} />
                                  {format(new Date(task.dueDate), "MMM d")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* New Comment Indicator */}
                        {(task.commentCount || 0) > 0 && (
                          <div className="flex items-center gap-1 text-primary">
                            <MessageSquare size={16} />
                            <span className="text-xs font-bold">{task.commentCount}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                           <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center overflow-hidden">
                            <Users size={14} className="text-text-muted" />
                          </div>
                          <span className="text-xs font-medium text-text-muted">
                            {assignee?.displayName || "Unassigned"}
                          </span>
                        </div>
                        
                        {isAssignedToMe && !task.acceptedByUser && (
                          <Button
                            size="sm"
                            className="h-8 text-xs px-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptTask(task);
                            }}
                          >
                            Accept
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        teamId={teamId || ""}
        members={members}
        isManager={isManager}
        onUpdateStatus={(taskId, status) => updateTask(taskId, { status })}
        onDelete={deleteTask}
      />

      {/* Add Task Modal */}
      <Modal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        title="Create Team Task"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateTask} className="space-y-5 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">Task Title</label>
            <Input
              autoFocus
              placeholder="What needs to be done?"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">Description (optional)</label>
            <textarea
              className="w-full px-4 py-3 bg-bg border-2 border-border rounded-xl focus:border-primary outline-none text-text text-sm transition-all resize-none min-h-[100px]"
              placeholder="Add more details..."
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">Priority</label>
              <select
                className="w-full px-4 py-2.5 bg-bg border-2 border-border rounded-xl focus:border-primary outline-none text-text text-sm"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">Due Date</label>
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">Assign To</label>
            <select
              className="w-full px-4 py-2.5 bg-bg border-2 border-border rounded-xl focus:border-primary outline-none text-text text-sm"
              value={newTask.assignedTo}
              onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
              required
            >
              <option value="">Select a member</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.displayName} ({member.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsAddTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Team Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
