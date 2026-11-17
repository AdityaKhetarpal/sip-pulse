"use client";
import { useEffect, useRef } from "react";

type VantaEffect = { destroy: () => void };
declare global {
  interface Window { THREE?: unknown; VANTA?: { NET: (o: Record<string, unknown>) => VantaEffect } }
}

function load(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.async = true; s.onload = () => resolve(); s.onerror = reject;
    document.head.appendChild(s);
  });
}

// A faint Vanta.js "net" behind the opening screen: the market's noise behind a steady SIP line.
// Skipped for reduced motion and on small screens.
export default function Vanta() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || innerWidth < 700) return;
    let effect: VantaEffect | null = null;
    let cancelled = false;
    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    load("https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js")
      .then(() => load("https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.net.min.js"))
      .then(() => {
        if (cancelled || !ref.current || !window.VANTA) return;
        effect = window.VANTA.NET({
          el: ref.current, mouseControls: false, touchControls: false, gyroControls: false,
          color: dark ? 0x26303a : 0xd5dbe0, backgroundColor: dark ? 0x0a0d10 : 0xffffff,
          points: 9, maxDistance: 22, spacing: 18, showDots: true, scale: 1, scaleMobile: 1,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; effect?.destroy(); };
  }, []);
  return <div className="vanta" ref={ref} aria-hidden="true" />;
}
