import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const AnimatedGradientBorder = ({
  children,
  className,
  containerClassName,
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  onClick?: () => void;
}) => {
  return (
    <div 
      className={cn("relative p-[2px] group cursor-pointer rounded-xl overflow-hidden", containerClassName)}
      onClick={onClick}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[0] z-0 left-1/2 top-1/2 h-[200%] w-[200%] origin-center -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0_340deg,var(--color-primary)_360deg)] opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <div className={cn("relative z-10 bg-surface rounded-xl w-full h-full", className)}>
        {children}
      </div>
    </div>
  );
};
