import type { Attachment } from "./task";

export interface Team {
  id: string;
  name: string;
  createdAt: number; // timestamp
  managerIds: string[]; // uid list
  memberIds: string[]; // uid list (includes managers)
}

export interface TeamMember {
  email: string;
  displayName: string;
  role: "manager" | "employee";
  joinedAt: number; // timestamp
}

export interface TeamTask {
  id: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  dueDate?: string;
  status: "pending" | "completed";
  assignedTo: string; // uid
  assignedBy: string; // uid (manager)
  createdAt: number; // timestamp
  acceptedByUser: boolean;
  attachments: Attachment[];
  commentCount?: number;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  attachments: Attachment[];
  createdAt: number; // timestamp
}
