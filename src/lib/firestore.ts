import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  updateDoc,
  orderBy,
  increment,
  type Unsubscribe
} from "firebase/firestore";
import { db } from "./firebase";
import type { Team, TeamMember, TeamTask, Comment } from "../types/team";

// --- Teams ---

export const createTeam = async (name: string, managerUid: string, managerEmail: string, managerDisplayName: string) => {
  if (!db) return null;

  const teamData = {
    name,
    createdAt: Date.now(),
    managerIds: [managerUid],
    memberIds: [managerUid],
  };

  const teamRef = await addDoc(collection(db!, "teams"), teamData);
  
  // Add managers as first member
  await setDoc(doc(db!, "teams", teamRef.id, "members", managerUid), {
    email: managerEmail,
    displayName: managerDisplayName,
    role: "manager",
    joinedAt: Date.now(),
  });

  return teamRef.id;
};

export const getTeams = async (uid: string): Promise<Team[]> => {
  if (!db) return [];
  
  const q = query(collection(db!, "teams"), where("memberIds", "array-contains", uid));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Team));
};

export const subscribeToTeams = (uid: string, callback: (teams: Team[]) => void): Unsubscribe | null => {
  if (!db) return null;

  const q = query(collection(db!, "teams"), where("memberIds", "array-contains", uid));
  return onSnapshot(q, (snapshot) => {
    const teams = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Team));
    callback(teams);
  });
};

// --- Members ---

export const inviteMember = async (teamId: string, email: string, role: "manager" | "employee") => {
  if (!db) return;
  
  // In a real app, this would send an email. For now, we'll store it as a pending invitation
  // or just add it to a members collection if we assume the user exists.
  // Requirement 9 says: "invite by email" -> "pending invite in Firestore (stub)"
  
  await addDoc(collection(db!, "invites"), {
    teamId,
    email: email.toLowerCase().trim(),
    role,
    invitedAt: Date.now(),
    status: "pending"
  });
};

export const removeMember = async (teamId: string, uid: string) => {
  if (!db) return;
  
  // 1. Remove from members subcollection
  await deleteDoc(doc(db!, "teams", teamId, "members", uid));
  
  // 2. Update team doc memberIds/managerIds
  const teamRef = doc(db!, "teams", teamId);
  const teamSnap = await getDoc(teamRef);
  if (teamSnap.exists()) {
    const data = teamSnap.data() as Team;
    await updateDoc(teamRef, {
      memberIds: data.memberIds.filter(id => id !== uid),
      managerIds: data.managerIds.filter(id => id !== uid),
    });
  }
};

export const subscribeToMembers = (teamId: string, callback: (members: (TeamMember & { id: string })[]) => void): Unsubscribe | null => {
  if (!db) return null;

  return onSnapshot(collection(db!, "teams", teamId, "members"), (snapshot) => {
    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TeamMember & { id: string }));
    callback(members);
  });
};

// --- Tasks ---

export const createTeamTask = async (teamId: string, task: Omit<TeamTask, "id" | "createdAt">) => {
  if (!db) return;
  
  await addDoc(collection(db!, "teams", teamId, "tasks"), {
    ...task,
    commentCount: 0,
    createdAt: Date.now(),
  });
};

export const updateTeamTask = async (teamId: string, taskId: string, updates: Partial<TeamTask>) => {
  if (!db) return;
  
  await updateDoc(doc(db!, "teams", teamId, "tasks", taskId), {
    ...updates,
    updatedAt: Date.now()
  });
};

export const deleteTeamTask = async (teamId: string, taskId: string) => {
  if (!db) return;
  await deleteDoc(doc(db!, "teams", teamId, "tasks", taskId));
};

export const subscribeToTasks = (teamId: string, callback: (tasks: TeamTask[]) => void): Unsubscribe | null => {
  if (!db) return null;

  const q = query(collection(db!, "teams", teamId, "tasks"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TeamTask));
    callback(tasks);
  });
};

// --- Comments ---

export const addComment = async (teamId: string, taskId: string, comment: Omit<Comment, "id" | "createdAt">) => {
  if (!db) return;
  
  await addDoc(collection(db!, "teams", teamId, "tasks", taskId, "comments"), {
    ...comment,
    createdAt: Date.now(),
  });

  // Increment comment count on the task
  await updateDoc(doc(db!, "teams", teamId, "tasks", taskId), {
    commentCount: increment(1)
  });
};

export const subscribeToComments = (teamId: string, taskId: string, callback: (comments: Comment[]) => void): Unsubscribe | null => {
  if (!db) return null;

  const q = query(
    collection(db!, "teams", teamId, "tasks", taskId, "comments"), 
    orderBy("createdAt", "asc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Comment));
    callback(comments);
  });
};
