import type { FilterState } from "./task";

export interface User {
  id: string; // uuid
  name: string;
  email?: string; // if logged in via Firebase
  firebaseUid?: string;
  role?: "employee" | "manager";
  createdAt: number;
}

export interface Settings {
  id: "user-settings"; // single-row pattern
  theme: "light" | "dark";
  hasSeenWelcome: boolean;
  lastFilters?: FilterState;
}

export interface JarvisMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  functionCall?: { name: string; args: Record<string, unknown> };
}
