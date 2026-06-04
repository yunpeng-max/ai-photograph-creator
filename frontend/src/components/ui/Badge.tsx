import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger";
type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-white/5 text-text-secondary",
  primary: "bg-accent-500/10 text-accent-400",
  success: "bg-success-400/10 text-success-400",
  warning: "bg-accent-400/10 text-accent-400",
  danger: "bg-red-400/10 text-red-400",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", size = "sm", className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium rounded-full",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";
