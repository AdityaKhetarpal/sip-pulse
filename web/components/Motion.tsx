"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Lenis for smooth scrolling and GSAP to fade sections in as they scroll into view.
// Both are skipped when the device asks for less motion.
export default function Motion() {
  const path = usePathname();

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let lenis: { destroy: () => void } | null = null;
    import("lenis").then(({ default: Lenis }) => { lenis = new Lenis({ autoRaf: true }); });
    return () => lenis?.destroy();
  }, []);

  useEffect(() => {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (calm) return;
    let observer: IntersectionObserver | null = null;
    import("gsap").then(({ gsap }) => {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          gsap.to(e.target, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
          observer?.unobserve(e.target);
        });
      }, { rootMargin: "0px 0px -8% 0px" });
      items.forEach((el) => observer!.observe(el));
    });
    // never leave anything hidden if the script is slow
    const t = setTimeout(() => items.forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; }), 2500);
    return () => { observer?.disconnect(); clearTimeout(t); };
  }, [path]);

  return null;
}
