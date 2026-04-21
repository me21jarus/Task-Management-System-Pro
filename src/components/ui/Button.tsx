import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/utils";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps
  extends Omit<
    HTMLMotionProps<"button"> & ButtonHTMLAttributes<HTMLButtonElement>,
    "ref"
  > {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover shadow-sm",
  outline:
    "border border-border bg-transparent text-text hover:bg-surface-elevated",
  ghost:
    "bg-transparent text-text hover:bg-surface-elevated",
  danger:
    "bg-danger text-white hover:opacity-90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-sm gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-md gap-2",
  lg: "px-7 py-3 text-base rounded-md gap-2.5",
};

const spinnerSize: Record<ButtonSize, "sm" | "md" | "lg"> = {
  sm: "sm",
  md: "sm",
  lg: "md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ y: -1, scale: 1.01 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-sans font-medium",
          "transition-colors duration-150 cursor-pointer",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Spinner
            size={spinnerSize[size]}
            className={
              variant === "primary" || variant === "danger"
                ? "border-white border-t-transparent"
                : ""
            }
          />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        <span>{children}</span>
      </motion.button>
    );
  }
);

Button.displayName = "Button";
