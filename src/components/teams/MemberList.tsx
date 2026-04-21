import { useState } from "react";
import { User, Mail, Shield, UserPlus, Trash2, ShieldCheck, MailPlus } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { ConfirmModal } from "../ui/ConfirmModal";
import type { TeamMember } from "../../types/team";
import { motion } from "framer-motion";

interface MemberListProps {
  members: (TeamMember & { id: string })[];
  isManager: boolean;
  onInvite: (email: string, role: "manager" | "employee") => void;
  onRemove: (uid: string) => void;
  currentUserUid: string;
}

export function MemberList({
  members,
  isManager,
  onInvite,
  onRemove,
  currentUserUid,
}: MemberListProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "employee">("employee");
  const [userToRemove, setUserToRemove] = useState<string | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    onInvite(inviteEmail.trim(), inviteRole);
    setInviteEmail("");
    setIsInviteModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text">Team Members</h2>
          <p className="text-text-muted text-sm mt-1">Manage roles and permissions for your team</p>
        </div>
        {isManager && (
          <Button 
            onClick={() => setIsInviteModalOpen(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <UserPlus size={16} />
            <span>Invite Member</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-surface-elevated border border-border rounded-2xl p-5 hover:border-primary/30 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-bg border border-border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <User size={24} className="text-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-text truncate">
                  {member.displayName}
                  {member.id === currentUserUid && (
                    <span className="ml-2 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tight">You</span>
                  )}
                </h3>
                <div className="flex items-center gap-1.5 text-text-muted text-xs mt-1">
                  <Mail size={12} />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  {member.role === "manager" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-md border border-primary/20">
                      <ShieldCheck size={10} />
                      Manager
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-text-muted/10 text-text-muted text-[10px] font-bold uppercase tracking-widest rounded-md border border-text-muted/20">
                      <Shield size={10} />
                      Employee
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isManager && member.id !== currentUserUid && (
              <button
                onClick={() => setUserToRemove(member.id)}
                className="absolute top-4 right-4 p-2 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
      >
        <form onSubmit={handleInvite} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <Input
                autoFocus
                placeholder="colleague@example.com"
                className="pl-10"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                type="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">Role</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setInviteRole("employee")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  inviteRole === "employee" 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                  : 'border-border bg-bg hover:border-text-muted'
                }`}
              >
                <div className="font-bold text-sm mb-1">Employee</div>
                <div className="text-[10px] text-text-muted leading-tight">Can view shared tasks and update own assignments.</div>
              </button>
              <button
                type="button"
                onClick={() => setInviteRole("manager")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  inviteRole === "manager" 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                  : 'border-border bg-bg hover:border-text-muted'
                }`}
              >
                <div className="font-bold text-sm mb-1 text-primary">Manager</div>
                <div className="text-[10px] text-text-muted leading-tight">Full control over tasks, members, and team settings.</div>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" type="button" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <MailPlus size={18} />
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirm Modal */}
      <ConfirmModal
        isOpen={!!userToRemove}
        onClose={() => setUserToRemove(null)}
        onConfirm={() => {
          if (userToRemove) onRemove(userToRemove);
          setUserToRemove(null);
        }}
        title="Remove Member"
        message="Are you sure you want to remove this member from the team? They will lose access to all shared tasks and discussions."
        confirmText="Remove Member"
        variant="danger"
      />
    </div>
  );
}
