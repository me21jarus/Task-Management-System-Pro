import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PixelDissolve } from "../components/welcome/PixelDissolve";
import { getUser, updateSettings } from "../lib/db";
import { logger } from "../lib/logger";

const HEADING_WORDS = ["Welcome", "to", "your", "Task", "Manager"];
const DISSOLVE_DELAY_MS = 2500;

export default function Welcome() {
  const navigate = useNavigate();
  const [showDissolve, setShowDissolve] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Trigger dissolve after heading animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMounted) {
        setShowDissolve(true);
      }
    }, DISSOLVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isMounted]);

  const handleDissolveComplete = useCallback(async () => {
    if (!isMounted) return;

    try {
      // Mark welcome as seen
      await updateSettings({ hasSeenWelcome: true });

      // Check if user already exists (returning user)
      const existingUser = await getUser();
      if (existingUser) {
        navigate("/app/personal", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    } catch (err) {
      logger.error("Error during welcome completion:", err);
      navigate("/onboarding", { replace: true });
    }
  }, [isMounted, navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-bg z-40 overflow-hidden">
      {/* Background dot grid pattern */}
      <div 
        className="absolute inset-0 -z-10 bg-[radial-gradient(var(--color-text-muted)_1px,transparent_1px)] opacity-[0.15]" 
        style={{ backgroundSize: '24px 24px' }} 
      />
      {/* Animated heading */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-6">
        {HEADING_WORDS.map((word, i) => (
          <motion.span
            key={word}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24,
              delay: i * 0.18,
            }}
            className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wider text-text"
          >
            {word}
          </motion.span>
        ))}
      </div>

      {/* Logo placeholder */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20,
          delay: HEADING_WORDS.length * 0.18 + 0.3,
        }}
        className="mt-10 flex flex-col items-center gap-3"
      >
        <img 
          src="/licious.gif" 
          alt="Licious Logo" 
          className="w-[160px] h-[160px] object-contain"
        />
      </motion.div>

      {/* Pixel dissolve overlay */}
      {showDissolve && <PixelDissolve onComplete={handleDissolveComplete} />}
    </div>
  );
}
