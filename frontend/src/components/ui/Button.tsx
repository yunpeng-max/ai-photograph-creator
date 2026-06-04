import { type ButtonHTMLAttributes, type ReactNode, type MouseEvent, forwardRef, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-500 text-white hover:bg-accent-600 shadow-md hover:shadow-glow active:shadow-sm",
  secondary:
    "bg-surface-200 text-text-primary hover:bg-surface-100 active:bg-surface-50",
  outline:
    "border border-white/10 bg-transparent text-text-primary hover:border-accent-400/50 hover:text-accent-400 hover:bg-accent-500/5",
  ghost:
    "text-text-secondary hover:text-text-primary hover:bg-white/5",
  danger:
    "bg-red-500 text-white hover:bg-red-600 shadow-md active:shadow-sm",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    const rippleRef = useRef<HTMLSpanElement>(null);

    const handleClick = useCallback(
      (e: MouseEvent<HTMLButtonElement>) => {
        // Ripple effect
        const btn = e.currentTarget;
        const ripple = rippleRef.current;
        if (ripple) {
          const rect = btn.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height) * 2;
          ripple.style.width = ripple.style.height = `${size}px`;
          ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
          ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
          ripple.classList.remove("animate-ripple");
          void ripple.offsetWidth; // reflow
          ripple.classList.add("animate-ripple");
        }
        onClick?.(e);
      },
      [onClick],
    );

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        className={cn(
          "relative inline-flex items-center justify-center font-medium rounded-xl overflow-hidden",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-600",
          "active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {/* Ripple */}
        <span
          ref={rippleRef}
          className="absolute rounded-full bg-white/20 pointer-events-none scale-0 opacity-0 animate-ripple"
          style={{ animation: "ripple 0.6s ease-out forwards" }}
        />
        {loading ? (
          <Loader2 className="animate-spin relative z-10" size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />
        ) : leftIcon ? (
          <span className="shrink-0 relative z-10">{leftIcon}</span>
        ) : null}
        <span className="relative z-10">{children}</span>
        {!loading && rightIcon && <span className="shrink-0 relative z-10">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
