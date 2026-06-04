import { useEffect, useRef } from "react";

/**
 * Mouse-following cursor glow / spotlight effect.
 * Renders a radial gradient that follows the mouse cursor.
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    const handleMove = (e: MouseEvent) => {
      requestAnimationFrame(() => {
        glow.style.setProperty("--x", `${e.clientX}px`);
        glow.style.setProperty("--y", `${e.clientY}px`);
        glow.style.opacity = "1";
      });
    };

    const handleLeave = () => {
      glow.style.opacity = "0";
    };

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="fixed pointer-events-none z-0 opacity-0 transition-opacity duration-300"
      style={{
        top: "var(--y, 0px)",
        left: "var(--x, 0px)",
        width: "280px",
        height: "280px",
        transform: "translate(-50%, -50%)",
        background:
          "radial-gradient(circle, rgba(49,130,252,0.15) 0%, rgba(49,130,252,0.08) 30%, rgba(139,186,254,0.03) 60%, transparent 80%)",
        borderRadius: "50%",
      }}
    />
  );
}
