import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, LogOut, Users } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useAuth } from "../../hooks/useAuth";
import { getUser } from "../../lib/db";
import { cn } from "../../lib/utils";
import { subscribeToTeams, subscribeToTasks } from "../../lib/firestore";

const TAGLINES = [
  "Order your tasks",
  "Getting things done, efficiently",
  "One task closer to freedom",
  "Fresh priorities, daily",
  "Ship, don't stall",
  "Plan. Do. Repeat.",
];

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ isSidebarOpen, onToggleSidebar }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [localName, setLocalName] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [unacceptedCount, setUnacceptedCount] = useState(0);

  // Load local user name from IndexedDB for pre-auth users
  useEffect(() => {
    getUser().then((u) => {
      if (u?.name) setLocalName(u.name);
    });
  }, []);

  // Listen for new team assignments
  useEffect(() => {
    if (!user) return;

    // This is a bit complex as we need to listen for tasks in EVERY team the user is in
    const unsubscribes: (() => void)[] = [];

    const unsubTeams = subscribeToTeams(user.uid, (teams) => {
      // Clear previous task subscriptions
      unsubscribes.forEach(unsub => unsub());
      unsubscribes.length = 0;

      const teamTaskCounts: Record<string, number> = {};

      teams.forEach(team => {
        const unsubTasks = subscribeToTasks(team.id, (tasks) => {
          const myUnaccepted = tasks.filter(t => t.assignedTo === user.uid && !t.acceptedByUser).length;
          teamTaskCounts[team.id] = myUnaccepted;
          
          // Sum up counts
          const total = Object.values(teamTaskCounts).reduce((a, b) => a + b, 0);
          setUnacceptedCount(total);
        });
        if (unsubTasks) unsubscribes.push(unsubTasks);
      });
    });

    return () => {
      unsubTeams?.();
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user]);

  const displayName = user?.displayName || localName || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // Rotate tagline every 8 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % TAGLINES.length);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  async function handleSignOut() {
    setDropdownOpen(false);
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-[60] h-16",
        "flex items-center px-4 gap-4",
        "bg-surface border-b border-border",
        "shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
      )}
    >
      {/* ── Left: hamburger (mobile) + logo + wordmark ── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* hamburger — visible below 768px */}
        <button
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
          className={cn(
            "md:hidden flex items-center justify-center w-9 h-9 rounded-md",
            "text-text-muted hover:text-text hover:bg-surface-elevated",
            "transition-colors duration-150 cursor-pointer"
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isSidebarOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X size={20} />
              </motion.span>
            ) : (
              <motion.span
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Menu size={20} />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <Link to="/app/personal" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
          {/* Licious gif logo */}
          <img 
            src="/licious.gif" 
            alt="Licious Logo" 
            className="w-12 h-12 object-contain"
          />

          <span
            className="text-2xl tracking-wide text-text hidden sm:block"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em" }}
          >
            Task Management System
          </span>
        </Link>
      </div>

      {/* ── Center: rotating tagline ── */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={taglineIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm text-text-muted font-medium text-center truncate max-w-xs"
          >
            {TAGLINES[taglineIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* ── Right: theme toggle + user button ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <ThemeToggle />

        {/* User button */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            onClick={() => setDropdownOpen((v) => !v)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className={cn(
              "flex items-center gap-2 pl-1 pr-2 py-1 rounded-md",
              "hover:bg-surface-elevated transition-colors duration-150 cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            )}
            aria-label="User menu"
          >
            {/* Avatar circle */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">{avatarLetter}</span>
              </div>
              
              <AnimatePresence>
                {unacceptedCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full border-2 border-surface flex items-center justify-center shadow-sm"
                  >
                    {unacceptedCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Name chip — layoutId enables shared element animation with onboarding */}
            <motion.span
              layoutId="user-name"
              className="text-sm font-medium text-text hidden sm:block max-w-[120px] truncate"
            >
              {displayName}
            </motion.span>

            <ChevronDown
              size={14}
              className={cn(
                "text-text-muted transition-transform duration-200",
                dropdownOpen && "rotate-180"
              )}
            />
          </motion.button>

          {/* Dropdown */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "absolute right-0 top-full mt-2 w-48",
                  "bg-surface border border-border rounded-lg",
                  "shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden"
                )}
              >
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5">Signed in as</p>
                  <p className="text-xs text-text truncate">
                    {user?.email || "Local user"}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    to="/app/teams"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-text hover:bg-surface-elevated transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-text-muted" />
                      <span>Team Dashboards</span>
                    </div>
                    {unacceptedCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-accent/10 text-accent text-[10px] font-bold rounded">
                        {unacceptedCount} new
                      </span>
                    )}
                  </Link>
                </div>

                <div className="border-t border-border pt-1">
                  <button
                    onClick={handleSignOut}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 text-sm",
                      "text-danger hover:bg-primary-soft",
                      "transition-colors duration-150 cursor-pointer text-left"
                    )}
                  >
                    <LogOut size={15} />
                    <span>Sign out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
