import { useState, useEffect, useCallback, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/** Google "G" logo — lucide-react has no brand icons */
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { getUser, setUser } from "../lib/db";
import { logger } from "../lib/logger";
import { cn } from "../lib/utils";

const PHRASES = [
  "Organize your day",
  "Work smarter, not harder",
  "Your tasks, your rules",
];

const PHRASE_INTERVAL_MS = 4000;

type AuthMode = "signin" | "signup";
type Role = "employee" | "manager";

export default function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, updateUserRole } = useAuth();

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [role, setRole] = useState<Role>("employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMousePosition({
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Rotate phrases
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
    }, PHRASE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Navigate away if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/app/personal", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handlePostAuth = useCallback(
    async (firebaseUid: string, firebaseEmail: string | null, displayName: string | null) => {
      try {
        // Update role in Firestore
        await updateUserRole(role);

        // Update IndexedDB user
        const localUser = await getUser();
        if (localUser) {
          await setUser({
            ...localUser,
            firebaseUid,
            email: firebaseEmail || undefined,
            role,
          });
        } else {
          await setUser({
            id: crypto.randomUUID(),
            name: displayName || firebaseEmail || "User",
            firebaseUid,
            email: firebaseEmail || undefined,
            role,
            createdAt: Date.now(),
          });
        }

        navigate("/app/personal", { replace: true });
      } catch (err) {
        logger.error("Post-auth setup failed:", err);
      }
    },
    [role, updateUserRole, navigate]
  );

  const handleGoogleSignIn = async () => {
    setError("");
    setSubmitting(true);
    try {
      await signInWithGoogle();
      // onAuthStateChanged will set user, then useEffect navigates
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      setError(message);
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      // onAuthStateChanged handles navigation
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      // Friendly error messages
      if (message.includes("user-not-found") || message.includes("wrong-password") || message.includes("invalid-credential")) {
        setError("Invalid email or password");
      } else if (message.includes("email-already-in-use")) {
        setError("An account with this email already exists. Try signing in instead.");
      } else if (message.includes("weak-password")) {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError(message);
      }
      setSubmitting(false);
    }
  };

  // When Firebase user appears, complete post-auth flow
  useEffect(() => {
    if (user && submitting) {
      handlePostAuth(user.uid, user.email, user.displayName);
    }
  }, [user, submitting, handlePostAuth]);

  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen md:h-screen flex flex-col md:flex-row bg-bg overflow-x-hidden overflow-y-auto"
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight Effect */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--color-primary-soft), transparent 80%)`,
          opacity: 0.5
        }}
      />
      {/* ── Left side: rotating phrases ── */}
      <div className="flex-1 flex items-center justify-center px-6 pt-10 pb-4 md:p-12 z-10 min-h-[28vh] md:min-h-0">
        <div className="relative h-24 sm:h-32 md:h-64 flex items-center justify-center w-full">
          <AnimatePresence mode="wait">
            <motion.h2
              key={phraseIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl tracking-wider text-text text-center leading-tight px-4"
            >
              {PHRASES[phraseIndex]}
            </motion.h2>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Right side: auth form ── */}
      <div className="flex-1 flex items-start md:items-center justify-center px-4 pb-8 md:p-12 z-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 24,
            delay: 0.2,
          }}
          className="w-full max-w-md"
        >
          <Card padding="lg">
            <div className="space-y-6">
              {/* Title */}
              <div className="text-center">
                <h1 className="font-display text-3xl tracking-wider text-text">
                  {mode === "signin" ? "Welcome Back" : "Create Account"}
                </h1>
                <p className="mt-1 text-sm text-text-muted">
                  {mode === "signin"
                    ? "Sign in to access your tasks"
                    : "Get started with Task Management System"}
                </p>
              </div>

              {/* Role selector (segmented control) */}
              <div className="flex rounded-md border border-border overflow-hidden">
                {(["employee", "manager"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-medium transition-colors duration-150 capitalize cursor-pointer",
                      role === r
                        ? "bg-primary text-white"
                        : "bg-surface text-text-muted hover:bg-surface-elevated"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Google sign-in */}
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleGoogleSignIn}
                loading={submitting}
                icon={<GoogleIcon size={18} />}
              >
                Sign in with Google
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
                  or
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Email/password form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <Input
                  id="login-email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="you@example.com"
                />

                <Input
                  id="login-password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="••••••••"
                />

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-sm text-danger text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={submitting}
                  icon={<ArrowRight size={18} />}
                >
                  {mode === "signin" ? "Sign In" : "Create Account"}
                </Button>
              </form>

              {/* Toggle mode */}
              <p className="text-sm text-text-muted text-center">
                {mode === "signin"
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setError("");
                  }}
                  className="text-primary font-medium hover:underline cursor-pointer"
                >
                  {mode === "signin" ? "Create one" : "Sign in"}
                </button>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
