import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, wrapperClassName, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={cn("space-y-1.5", wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-xl border bg-surface-300 px-4 py-2.5 text-sm text-text-primary",
              "placeholder:text-text-tertiary",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400/50",
              error
                ? "border-red-400/30 focus:ring-red-400/20 focus:border-red-400"
                : "border-white/10",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-400 animate-slide-down">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
