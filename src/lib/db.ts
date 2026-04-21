import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { User, Settings, JarvisMessage } from "../types/user";
import type { Task } from "../types/task";

/**
 * IndexedDB schema definition for tms-pro database.
 * Version 1 includes stores for user, tasks, settings, and jarvis_history.
 */
interface TMSProDB extends DBSchema {
  user: {
    key: string;
    value: User;
  };
  tasks: {
    key: string;
    value: Task;
    indexes: {
      "by-status": string;
      "by-priority": string;
      "by-created": number;
    };
  };
  settings: {
    key: string;
    value: Settings;
  };
  jarvis_history: {
    key: string;
    value: JarvisMessage;
    indexes: {
      "by-timestamp": number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<TMSProDB>> | null = null;

function getDB(): Promise<IDBPDatabase<TMSProDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TMSProDB>("tms-pro", 1, {
      upgrade(db) {
        // User store — single-row pattern
        if (!db.objectStoreNames.contains("user")) {
          db.createObjectStore("user", { keyPath: "id" });
        }

        // Tasks store with indexes for filtering
        if (!db.objectStoreNames.contains("tasks")) {
          const taskStore = db.createObjectStore("tasks", { keyPath: "id" });
          taskStore.createIndex("by-status", "status");
          taskStore.createIndex("by-priority", "priority");
          taskStore.createIndex("by-created", "createdAt");
        }

        // Settings store — single-row pattern
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }

        // Jarvis conversation history
        if (!db.objectStoreNames.contains("jarvis_history")) {
          const jarvisStore = db.createObjectStore("jarvis_history", {
            keyPath: "id",
          });
          jarvisStore.createIndex("by-timestamp", "timestamp");
        }
      },
    });
  }
  return dbPromise;
}

// ── User helpers ──

export async function getUser(): Promise<User | undefined> {
  const db = await getDB();
  const all = await db.getAll("user");
  return all[0];
}

export async function setUser(user: User): Promise<void> {
  const db = await getDB();
  await db.put("user", user);
}

export async function deleteUser(): Promise<void> {
  const db = await getDB();
  await db.clear("user");
}

// ── Settings helpers ──

const DEFAULT_SETTINGS: Settings = {
  id: "user-settings",
  theme: "light",
  hasSeenWelcome: false,
};

export async function getSettings(): Promise<Settings> {
  const db = await getDB();
  const settings = await db.get("settings", "user-settings");
  if (!settings) {
    await db.put("settings", DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return settings;
}

export async function updateSettings(
  partial: Partial<Omit<Settings, "id">>
): Promise<Settings> {
  const db = await getDB();
  const current = await getSettings();
  const updated: Settings = { ...current, ...partial, id: "user-settings" };
  await db.put("settings", updated);
  return updated;
}

// ── Task helpers (basic — full CRUD in Phase 4) ──

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB();
  return db.getAll("tasks");
}

export async function getTask(id: string): Promise<Task | undefined> {
  const db = await getDB();
  return db.get("tasks", id);
}

export async function putTask(task: Task): Promise<void> {
  const db = await getDB();
  await db.put("tasks", task);
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("tasks", id);
}

// ── Jarvis history helpers ──

export async function getJarvisHistory(): Promise<JarvisMessage[]> {
  const db = await getDB();
  return db.getAllFromIndex("jarvis_history", "by-timestamp");
}

export async function addJarvisMessage(msg: JarvisMessage): Promise<void> {
  const db = await getDB();
  await db.put("jarvis_history", msg);
}

export async function clearJarvisHistory(): Promise<void> {
  const db = await getDB();
  await db.clear("jarvis_history");
}
