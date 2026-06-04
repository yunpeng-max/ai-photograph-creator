import { useState, useEffect, useRef } from "react";
import { cn } from "../lib/utils";

/**
 * Typewriter text animation that types out text character by character.
 */
interface TypewriterTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  showCursor?: boolean;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
}

export default function TypewriterText({
  text,
  className,
  speed = 50,
  delay = 0,
  showCursor = true,
  tag: Tag = "span",
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (indexRef.current >= text.length) return;

    const timer = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [started, text, speed]);

  return (
    <Tag className={cn("inline-block", className)}>
      {displayed || (started ? "" : " ")}
      {showCursor && started && indexRef.current < text.length && (
        <span className="animate-pulse text-accent-400">|</span>
      )}
    </Tag>
  );
}
