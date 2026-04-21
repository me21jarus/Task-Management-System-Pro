import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, Clock, LayoutList, Users, ShieldCheck, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useTaskContext } from "../../contexts/TaskContext";
import { useAuth } from "../../hooks/useAuth";
import { subscribeToTeams } from "../../lib/firestore";
import { useEffect, useState } from "react";
import type { Team } from "../../types/team";

// Fake counts removed

type FilterType = "all" | "pending" | "completed" | "team";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  onFilterChange?: (filter: FilterType) => void;
  activeFilter?: FilterType;
}

interface CounterCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  isPending?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

function CounterCard({
  label,
  count,
  icon,
  isPending = false,
  isActive = false,
  onClick,
}: CounterCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "group relative w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left",
        "border transition-all duration-200 cursor-pointer",
        isActive
          ? "bg-primary-soft border-primary/30 text-primary"
          : "bg-surface border-border text-text hover:border-border hover:bg-surface-elevated"
      )}
    >
      <span className={cn("flex-shrink-0", isActive ? "text-primary" : "text-text-muted")}>
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>

      <div className="flex items-center gap-1.5">
        {isPending && count > 0 && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
          />
        )}
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            isActive ? "text-primary" : "text-text"
          )}
        >
          {count}
        </span>
      </div>

      {/* Hover Tooltip Breakdown */}
      <div className="absolute top-1/2 left-full -translate-y-1/2 ml-4 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all z-50">
        <div className="bg-surface-elevated border border-border rounded-lg shadow-xl px-3 py-2 whitespace-nowrap hidden md:block">
          <p className="text-xs font-medium text-text">{label} Tasks: <span className="font-bold">{count}</span></p>
        </div>
      </div>
    </motion.button>
  );
}

export function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const { user } = useAuth();
  const { 
    tasks, 
    openCreateModal, 
    filters, 
    setFilters 
  } = useTaskContext();

  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTeams(user.uid, setTeams);
    return () => { if (unsubscribe) unsubscribe(); };
  }, [user]);

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    completed: tasks.filter(t => t.status === "completed").length,
    team: tasks.filter(t => !!t.teamId).length,
  };

  const activeFilter = filters.status || "all";

  const handleFilterChange = (filter: FilterType) => {
    if (filter === "all") {
      const { status: _, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({ ...filters, status: filter as any });
    }
    onClose?.(); // Close sidebar on mobile after selecting a filter
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── New Task button ── */}
      <div className="p-4 pb-0">
        <motion.button
          onClick={openCreateModal}
          whileHover={{ y: -1, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "bg-primary hover:bg-primary-hover text-white",
            "px-4 py-2.5 rounded-lg text-sm font-semibold",
            "shadow-sm transition-colors duration-150 cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          )}
        >
          <Plus size={16} />
          <span>New Task</span>
        </motion.button>
      </div>

      {/* ── Counter cards ── */}
      <div className="px-4 pt-4 space-y-2">
        <Link 
          to="/app/personal"
          className="flex items-center justify-between group px-1 mb-3"
        >
          <p className="text-xs font-semibold text-text-muted group-hover:text-primary uppercase tracking-wider transition-colors">
            Personal Tasks
          </p>
          <ClipboardList size={14} className="text-text-muted group-hover:text-primary transition-colors" />
        </Link>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.06 } },
          }}
          className="space-y-2"
        >
          {(["pending", "completed", "team", "all"] as FilterType[]).map((filter) => {
            const info = {
              pending: {
                label: "Pending",
                count: counts.pending,
                icon: <Clock size={16} />,
                isPending: true,
              },
              completed: {
                label: "Completed",
                count: counts.completed,
                icon: <CheckCircle2 size={16} />,
                isPending: false,
              },
              team: {
                label: "Team Tasks",
                count: counts.team,
                icon: <Users size={16} />,
                isPending: false,
              },
              all: {
                label: "Total",
                count: counts.all,
                icon: <LayoutList size={16} />,
                isPending: false,
              },
            }[filter];

            return (
              <motion.div
                key={filter}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
                }}
              >
                <CounterCard
                  {...info}
                  isActive={activeFilter === filter}
                  onClick={() => handleFilterChange(filter)}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Divider + My Team ── */}
      <div className="px-4 pt-6">
        <div className="border-t border-border" />
        <div className="pt-5 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-text-muted" />
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                My Teams
              </p>
            </div>
            <Link 
              to="/app/teams" 
              className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tight"
            >
              View All
            </Link>
          </div>
          
          <div className="space-y-1">
            {teams.length === 0 ? (
              <p className="text-xs text-text-muted px-1 italic">No teams joined yet</p>
            ) : (
              teams.map((team) => (
                <Link
                  key={team.id}
                  to={`/app/teams/${team.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-elevated group transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="text-[10px] font-bold uppercase">{team.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate group-hover:text-primary transition-colors">
                      {team.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-text-muted">
                        {team.memberIds.length} members
                      </span>
                      {team.managerIds.includes(user?.uid || "") && (
                        <ShieldCheck size={10} className="text-primary" />
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Version footer ── */}
      <div className="px-4 py-4 border-t border-border">
        <p className="text-xs text-text-muted/50 text-center">Task Management System v0.1</p>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar (always visible ≥768px) ── */}
      <aside
        className={cn(
          "hidden md:flex flex-col",
          "w-[260px] min-w-[260px]",
          "h-full overflow-y-auto",
          "bg-surface border-r border-border"
        )}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile drawer (below 768px) ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-black/40 md:hidden"
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "fixed top-16 left-0 bottom-0 z-50",
                "w-[260px] flex flex-col",
                "bg-surface border-r border-border overflow-y-auto md:hidden"
              )}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
