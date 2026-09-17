import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

const COLORS = ["#ff6b4a", "#fdc73a", "#ff6586", "#2ec4b6", "#231a11", "#ae3115"];

interface ConfettiBurstProps {
  count?: number;
}

type AnimeAnimation = ReturnType<typeof import("animejs")["animate"]>;

/**
 * anime.js confetti micro-burst ("moment of delight" — UI/UX §9).
 * Spawns absolutely-positioned pieces from the center of the screen and
 * scatters them with a random spring.
 *
 * animejs is loaded on demand via a dynamic import inside the effect, so
 * the library never ships in the initial bundle — or even the booking
 * chunk — and only downloads the moment a burst actually fires. Skipped
 * entirely for users who request reduced motion.
 */
export function ConfettiBurst({ count = 90 }: ConfettiBurstProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    const animations: AnimeAnimation[] = [];
    let timeout = 0;

    void import("animejs")
      .then(({ animate, random }) => {
        if (cancelled) return;

        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 3;

        for (let i = 0; i < count; i++) {
          const piece = document.createElement("span");
          const size = random(6, 12);
          const color = COLORS[i % COLORS.length];
          piece.style.cssText = [
            "position:fixed",
            `left:${cx}px`,
            `top:${cy}px`,
            `width:${size}px`,
            `height:${size}px`,
            `background:${color}`,
            `border-radius:${random(0, 50) > 25 ? "50%" : "2px"}`,
            "pointer-events:none",
            "z-index:200",
            "will-change:transform",
          ].join(";");
          host.appendChild(piece);

          const angle = (Math.PI * 2 * i) / count + random(-0.4, 0.4);
          const distance = random(120, window.innerWidth * 0.45);
          const tx = Math.cos(angle) * distance;
          const ty = Math.sin(angle) * distance - random(40, 160);

          animations.push(
            animate(piece, {
              translateX: [0, tx, tx * 0.6],
              translateY: [0, ty, ty + random(80, 200)],
              rotate: [0, random(-360, 360)],
              scale: [1, random(0.4, 1.2), 0.2],
              opacity: [1, 1, 0],
              duration: random(900, 1600),
              delay: random(0, 150),
              ease: "outCubic",
            })
          );
        }

        timeout = window.setTimeout(() => {
          animations.forEach((a) => a.pause());
          host.replaceChildren();
        }, 2200);
      })
      .catch(() => {
        // A confetti burst must never break the page — if the chunk fails
        // to load (offline, hiccup), we simply skip the animation.
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      animations.forEach((a) => a.pause());
      host.replaceChildren();
    };
  }, [count, reduce]);

  return <div ref={hostRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[200]" />;
}
