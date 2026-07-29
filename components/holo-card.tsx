"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import type { ReactNode, MouseEvent } from "react";

type HoloCardProps = {
  eyebrow: string;
  title: string;
  text: string;
  icon: ReactNode;
  accent: "violet" | "cyan" | "amber" | "rose";
  onClick?: () => void;
};

export function HoloCard({
  eyebrow,
  title,
  text,
  icon,
  accent,
  onClick,
}: HoloCardProps) {
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(50);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const glow = useMotionTemplate`radial-gradient(circle at ${pointerX}% ${pointerY}%, rgba(255,255,255,.34), transparent 38%)`;

  function handleMove(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    pointerX.set(x);
    pointerY.set(y);
    rotateY.set((x - 50) / 11);
    rotateX.set((50 - y) / 13);
  }

  function reset() {
    pointerX.set(50);
    pointerY.set(50);
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.button
      className={`holo-card ${accent}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      <motion.span className="holo-glow" style={{ background: glow }} />
      <span className="card-icon">{icon}</span>
      <span className="card-copy">
        <small>{eyebrow}</small>
        <strong>{title}</strong>
        <span>{text}</span>
      </span>
      <span className="card-arrow">↗</span>
    </motion.button>
  );
}
