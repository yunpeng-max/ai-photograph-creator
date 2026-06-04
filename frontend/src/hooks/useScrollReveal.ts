import { useEffect, useRef, type RefObject } from "react";

/**
 * Intersection Observer hook for scroll-triggered entrance animations.
 * Adds `is-visible` class to the element when it scrolls into view.
 */
export function useScrollReveal<T extends HTMLElement>(
  options?: IntersectionObserverInit,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px", ...options },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return ref;
}
