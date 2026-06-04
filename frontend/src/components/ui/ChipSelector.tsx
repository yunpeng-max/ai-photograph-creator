import { cn } from "../../lib/utils";

interface ChipOption {
  key: string;
  label: string;
}

interface ChipSelectorProps {
  options: ChipOption[];
  value: string;
  onChange: (key: string) => void;
  columns?: number;
}

export function ChipSelector({ options, value, onChange, columns }: ChipSelectorProps) {
  return (
    <div
      className={cn("grid gap-2")}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((opt) => {
        const isSelected = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "px-3 py-2 text-sm rounded-full border transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              isSelected
                ? "bg-accent-500 text-white border-accent-500 shadow-glow"
                : "bg-transparent text-text-tertiary border-white/10 hover:border-accent-400/40 hover:text-accent-400 hover:bg-accent-500/5",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
