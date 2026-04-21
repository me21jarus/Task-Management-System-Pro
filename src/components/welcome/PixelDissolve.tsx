import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

interface PixelDissolveProps {
  onComplete: () => void;
}

const COLS = 30;
const ROWS = 20;

export function PixelDissolve({ onComplete }: PixelDissolveProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Pre-compute random values for each pixel
  const pixels = useMemo(() => {
    const items = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        items.push({
          id: `${row}-${col}`,
          row,
          col,
          delay: Math.random() * 0.8,
          duration: 1.5 + Math.random(),
          xDrift: (Math.random() - 0.5) * 200,
          rotation: (Math.random() - 0.5) * 360,
        });
      }
    }
    return items;
  }, []);

  // Find the longest animation to know when dissolve completes
  const maxDuration = useMemo(() => {
    return Math.max(...pixels.map((p) => p.delay + p.duration));
  }, [pixels]);

  useEffect(() => {
    setIsAnimating(true);

    const timeout = setTimeout(() => {
      onComplete();
    }, maxDuration * 1000 + 200); // small buffer

    return () => clearTimeout(timeout);
  }, [maxDuration, onComplete]);

  if (!isAnimating) return null;

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
      }}
    >
      {pixels.map((pixel) => (
        <motion.div
          key={pixel.id}
          initial={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
          animate={{
            y: window.innerHeight + 100,
            x: pixel.xDrift,
            rotate: pixel.rotation,
            opacity: [1, 1, 0],
          }}
          transition={{
            delay: pixel.delay,
            duration: pixel.duration,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="w-full h-full"
          style={{ backgroundColor: "var(--color-bg)" }}
        />
      ))}
    </div>
  );
}
