import { useLocale } from "../context/LocaleContext";
import { cn } from "../lib/utils";

export default function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/10">
      <button
        onClick={() => setLocale("zh")}
        className={cn(
          "px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200",
          locale === "zh"
            ? "bg-white/10 text-text-primary shadow-sm"
            : "text-text-tertiary hover:text-text-secondary",
        )}
      >
        中文
      </button>
      <button
        onClick={() => setLocale("en")}
        className={cn(
          "px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200",
          locale === "en"
            ? "bg-white/10 text-text-primary shadow-sm"
            : "text-text-tertiary hover:text-text-secondary",
        )}
      >
        EN
      </button>
    </div>
  );
}
