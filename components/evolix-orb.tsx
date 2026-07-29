"use client";

import { motion } from "motion/react";

type OrbState = "idle" | "listening" | "thinking" | "speaking";

export function EvoliXOrb({ state }: { state: OrbState }) {
  const speed =
    state === "speaking" ? 1.1 : state === "thinking" ? 2.8 : 4.5;

  return (
    <div className={`orb-stage ${state}`} aria-label={`EvoliX ist ${state}`}>
      <motion.div
        className="orbit orbit-one"
        animate={{ rotate: 360 }}
        transition={{ duration: speed * 2, repeat: Infinity, ease: "linear" }}
      >
        <i />
        <i />
      </motion.div>
      <motion.div
        className="orbit orbit-two"
        animate={{ rotate: -360 }}
        transition={{ duration: speed * 2.8, repeat: Infinity, ease: "linear" }}
      >
        <i />
      </motion.div>
      <motion.div
        className="evolix-orb"
        animate={{
          scale:
            state === "listening"
              ? [1, 1.05, 1]
              : state === "speaking"
                ? [1, 1.08, 0.98, 1.04, 1]
                : [1, 1.02, 1],
          y: [0, -8, 0],
        }}
        transition={{
          duration: state === "speaking" ? 0.9 : 3.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="orb-aurora" />
        <div className="orb-cloud cloud-a" />
        <div className="orb-cloud cloud-b" />
        <div className="orb-core">
          <span />
        </div>
        <div className="orb-shine" />
      </motion.div>
      <div className="orb-runes">
        <span>ᚨ</span>
        <span>✦</span>
        <span>ᛉ</span>
        <span>◇</span>
      </div>
    </div>
  );
}
