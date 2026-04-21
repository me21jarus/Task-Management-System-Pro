import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Users, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { subscribeToTeams, createTeam } from "../lib/firestore";
import { collection, query, where, updateDoc, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { AnimatedGradientBorder } from "../components/ui/AnimatedGradientBorder";
import type { Team } from "../types/team";
import { logger } from "../lib/logger";

export default function TeamsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [isJoining, setIsJoining] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) return;

    // Real-time listener for invitations
    let unsubInvites: () => void;
    if (user.email) {
      const inviteQuery = query(
        collection(db, "invites"), 
        where("email", "==", user.email.toLowerCase()), 
        where("status", "==", "pending")
      );
      
      unsubInvites = onSnapshot(inviteQuery, async (snapshot) => {
        const invites = [];
        for (const inviteDoc of snapshot.docs) {
          const inviteData = inviteDoc.data();
          try {
            const teamSnap = await getDoc(doc(db!, "teams", inviteData.teamId));
            invites.push({
              id: inviteDoc.id,
              ...inviteData,
              teamName: teamSnap.exists() ? (teamSnap.data() as any).name : "Unknown Team"
            });
          } catch (err) {
            logger.error("Failed to fetch team name for invite:", err);
          }
        }
        setPendingInvites(invites);
      });
    }

    // Real-time listener for teams
    const unsubTeams = subscribeToTeams(user.uid, (fetchedTeams) => {
      setTeams(fetchedTeams);
      setLoading(false);
    });

    return () => {
      if (unsubInvites) unsubInvites();
      if (unsubTeams) unsubTeams();
    };
  }, [user]);

  const handleJoinTeam = async (invite: any) => {
    if (!user || !db) return;
    setIsJoining(invite.id);
    try {
      const { teamId, role: invitedRole } = invite;
      const teamRef = doc(db, "teams", teamId);
      const teamSnap = await getDoc(teamRef);
      
      if (teamSnap.exists()) {
        const teamData = teamSnap.data() as Team;
        
        // 1. Add user to team doc
        await updateDoc(teamRef, {
          memberIds: [...new Set([...teamData.memberIds, user.uid])],
          ...(invitedRole === "manager" ? { managerIds: [...new Set([...teamData.managerIds, user.uid])] } : {})
        });
        
        // 2. Add to members subcollection
        await setDoc(doc(db, "teams", teamId, "members", user.uid), {
          email: user.email,
          displayName: user.displayName || user.email || "Member",
          role: invitedRole,
          joinedAt: Date.now()
        });
        
        // 3. Mark invite as joined
        await updateDoc(doc(db, "invites", invite.id), {
          status: "joined",
          joinedAt: Date.now(),
          uid: user.uid
        });

        // 4. Update UI
        setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
      }
    } catch (err) {
      logger.error("Failed to join team:", err);
    } finally {
      setIsJoining(null);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTeamName.trim()) return;

    setIsCreating(true);
    try {
      const teamId = await createTeam(
        newTeamName, 
        user.uid, 
        user.email || "", 
        user.displayName || "Manager"
      );
      if (teamId) {
        setIsModalOpen(false);
        setNewTeamName("");
        navigate(`/app/teams/${teamId}`);
      }
    } catch (error) {
      logger.error("Failed to create team:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-text mb-2">
            My Teams
          </h1>
          <p className="text-text-muted">
            Collaborate with your coworkers on shared projects
          </p>
        </div>
        {user?.role === "manager" && (
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <motion.div animate={{ rotate: isModalOpen ? 45 : 0 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
              <Plus size={18} />
            </motion.div>
            <span>Create Team</span>
          </Button>
        )}
      </div>

      {pendingInvites.length > 0 && (
        <div className="mb-10 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
            Pending Invitations
            <span className="w-5 h-5 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">
              {pendingInvites.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingInvites.map((invite) => (
              <motion.div
                key={invite.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-text">Invite to {invite.teamName}</h3>
                    <p className="text-xs text-text-muted">You've been invited as an {invite.role}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleJoinTeam(invite)}
                  loading={isJoining === invite.id}
                >
                  Join Team
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {teams.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-24 h-24 bg-primary-soft rounded-full flex items-center justify-center mb-6">
            <Users size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">No teams yet</h2>
          <p className="text-text-muted mb-8 max-w-md">
            {user?.role === "manager" 
              ? "You are not a member of any team. Create your own team to start collaborating."
              : "You haven't been invited to any teams yet. Ask your manager to invite you via your email."}
          </p>
          {user?.role === "manager" && (
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>
              Start a new team
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, index) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="group hover:border-primary/50 transition-all cursor-pointer h-full border-2 border-transparent"
                onClick={() => navigate(`/app/teams/${team.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <Users size={20} />
                    </div>
                    <span className="text-xs font-mono text-text-muted">
                      {team.memberIds.length} members
                    </span>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {team.name}
                  </CardTitle>
                  <CardDescription>
                    Created {new Date(team.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-primary font-medium text-sm mt-4">
                    <span>View Dashboard</span>
                    <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                  </CardContent>
              </Card>
            </motion.div>
          ))}
          {user?.role === "manager" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: teams.length * 0.05 }}
              className="h-full"
            >
              <AnimatedGradientBorder 
                containerClassName="h-full rounded-2xl group border border-dashed border-border hover:border-transparent transition-all"
                className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px]"
                onClick={() => setIsModalOpen(true)}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
                  <Plus size={24} />
                </div>
                <h3 className="text-lg font-bold text-text group-hover:text-primary transition-colors">Create New Team</h3>
                <p className="text-sm text-text-muted mt-2">Start collaborating with your team</p>
              </AnimatedGradientBorder>
            </motion.div>
          )}
        </div>
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create a New Team"
      >
        <form onSubmit={handleCreateTeam} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">
              Team Name
            </label>
            <Input
              autoFocus
              placeholder="e.g. Acme Marketing, Dev Squad"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              required
            />
          </div>
          
          <div className="bg-bg p-4 rounded-lg border border-border">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Users size={16} className="text-primary" />
              </div>
              <div className="text-xs text-text-muted leading-relaxed">
                As the creator, you will be designated as the <strong>Manager</strong>. 
                You'll be able to invite members, assign tasks, and manage roles.
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={isCreating}
              disabled={!newTeamName.trim()}
            >
              Create Team
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
