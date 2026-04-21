import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { setUser } from "../lib/db";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { logger } from "../lib/logger";

export default function Onboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await setUser({
        id: crypto.randomUUID(),
        name: trimmed,
        createdAt: Date.now(),
      });

      setSubmitted(true);

      // Show greeting for 1.5s then navigate
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      logger.error("Failed to save user:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24,
            }}
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-6 w-full max-w-md px-6"
          >
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl md:text-5xl tracking-wider text-text text-center"
            >
              What should I call you?
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="w-full"
            >
              <Input
                id="onboarding-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Your name"
                autoFocus
                error={error}
                className="text-center text-lg py-3"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                type="submit"
                size="lg"
                loading={loading}
                disabled={!name.trim()}
              >
                Continue
              </Button>
            </motion.div>
          </motion.form>
        ) : (
          <motion.div
            key="greeting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24,
            }}
            className="flex items-center gap-3 text-center"
          >
            <span className="font-display text-4xl md:text-6xl tracking-wider text-text">
              Hello,
            </span>
            <motion.span
              layoutId="user-name"
              className="font-display text-4xl md:text-6xl tracking-wider"
              style={{ color: "var(--color-primary)" }}
            >
              {name.trim()}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
