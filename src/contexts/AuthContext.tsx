import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db as firestoreDb, hasConfig } from "../lib/firebase";
import { logger } from "../lib/logger";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: "employee" | "manager";
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserRole: (role: "employee" | "manager") => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

const googleProvider = new GoogleAuthProvider();

async function fetchUserRole(uid: string): Promise<"employee" | "manager" | undefined> {
  if (!firestoreDb) return undefined;
  try {
    const userDoc = await getDoc(doc(firestoreDb, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.role as "employee" | "manager" | undefined;
    }
  } catch (err) {
    logger.error("Failed to fetch user role:", err);
  }
  return undefined;
}

function firebaseUserToAuthUser(
  fbUser: FirebaseUser,
  role?: "employee" | "manager"
): AuthUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    photoURL: fbUser.photoURL,
    role,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !hasConfig) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const role = await fetchUserRole(fbUser.uid);
        setUser(firebaseUserToAuthUser(fbUser, role));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw new Error("Firebase not configured");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!auth) throw new Error("Firebase not configured");
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!auth) throw new Error("Firebase not configured");
      setLoading(true);
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    setUser(null);
  }, []);

  const updateUserRole = useCallback(
    async (role: "employee" | "manager") => {
      if (!user || !firestoreDb) return;
      try {
        await setDoc(
          doc(firestoreDb, "users", user.uid),
          {
            role,
            email: user.email,
            displayName: user.displayName,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
        setUser((prev) => (prev ? { ...prev, role } : null));
      } catch (err) {
        logger.error("Failed to update user role:", err);
        throw err;
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
