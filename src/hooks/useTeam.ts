import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "../contexts/ToastContext";
import { 
  subscribeToTasks, 
  subscribeToMembers, 
  updateTeamTask, 
  deleteTeamTask, 
  createTeamTask,
  removeMember,
  inviteMember 
} from "../lib/firestore";
import type { TeamTask, TeamMember, Team } from "../types/team";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { logger } from "../lib/logger";

export function useTeam(teamId: string | undefined) {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [members, setMembers] = useState<(TeamMember & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const currentUserRole = members.find(m => m.id === user?.uid)?.role || null;
  const isManager = currentUserRole === "manager";

  // Fetch team details
  useEffect(() => {
    if (!teamId || !db || !user) {
      setLoading(false);
      if (!teamId) {
        setError("No team selected");
      }
      return;
    }

    const fetchTeam = async () => {
      try {
        const teamDoc = await getDoc(doc(db!, "teams", teamId));
        if (teamDoc.exists()) {
          const nextTeam = { id: teamDoc.id, ...teamDoc.data() } as Team;
          if (!nextTeam.memberIds.includes(user.uid)) {
            setTeam(null);
            setTasks([]);
            setMembers([]);
            setError("You are not added to any team yet.");
            setLoading(false);
            return;
          }
          setTeam(nextTeam);
          setError(null);
        } else {
          setError("Team not found");
          setTeam(null);
        }
      } catch (err) {
        logger.error("Failed to fetch team details:", err);
        setError("Failed to fetch team details");
        setTeam(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId, user]);

  // Subscribe to tasks
  useEffect(() => {
    if (!teamId || !team) return;

    const unsubscribe = subscribeToTasks(teamId, (newTasks) => {
      setTasks(newTasks);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [teamId, team]);

  // Subscribe to members
  useEffect(() => {
    if (!teamId || !team) return;

    const unsubscribe = subscribeToMembers(teamId, (newMembers) => {
      setMembers(newMembers);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [teamId, team]);

  const addTask = useCallback(async (task: Omit<TeamTask, "id" | "createdAt">) => {
    if (!teamId) return;
    try {
      await createTeamTask(teamId, task);
      toast("Task created successfully", "success");
    } catch (err) {
      toast("Failed to create task", "error");
    }
  }, [teamId, toast]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<TeamTask>) => {
    if (!teamId) return;
    try {
      await updateTeamTask(teamId, taskId, updates);
    } catch (err) {
      toast("Failed to update task", "error");
    }
  }, [teamId, toast]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!teamId) return;
    try {
      await deleteTeamTask(teamId, taskId);
      toast("Task deleted", "success");
    } catch (err) {
      toast("Failed to delete task", "error");
    }
  }, [teamId, toast]);

  const inviteNewMember = useCallback(async (email: string, role: "manager" | "employee") => {
    if (!teamId) return;
    try {
      await inviteMember(teamId, email, role);
      toast("Invitation sent", "success");
    } catch (err) {
      toast("Failed to invite member", "error");
    }
  }, [teamId, toast]);

  const removeTeamMember = useCallback(async (uid: string) => {
    if (!teamId) return;
    try {
      await removeMember(teamId, uid);
      toast("Member removed", "success");
    } catch (err) {
      toast("Failed to remove member", "error");
    }
  }, [teamId, toast]);

  return {
    team,
    tasks,
    members,
    loading,
    error,
    currentUserRole,
    isManager,
    addTask,
    updateTask,
    deleteTask,
    inviteNewMember,
    removeTeamMember,
  };
}
