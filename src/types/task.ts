export interface Attachment {
  id: string;
  type: "link" | "file";
  name: string;
  url: string; // for files: object URL or Firebase Storage URL
  size?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  dueDate?: string; // ISO date
  status: "pending" | "completed";
  createdAt: number;
  updatedAt: number;
  attachments: Attachment[];
  sourceTaskId?: string; // if accepted from a team assignment
  teamId?: string;
  emoji?: string;
}

export type FilterState = {
  priority?: Task["priority"][]; // Multi-select
  status?: Task["status"] | "all" | "team";
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "priority" | "dueDate" | "name" | "createdAt";
  sortDirection?: "asc" | "desc";
  search?: string;
};

export type PartialTask = Partial<Task>;
