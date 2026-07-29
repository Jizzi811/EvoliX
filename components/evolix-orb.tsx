"use client";

import Image from "next/image";
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
        <Image
          className="orb-image"
          src="/evolix-orb.webp"
          alt="EvoliX – ein magisches Evolutionsrelikt aus dunklem Metall mit violettem Energiekern"
          fill
          priority
          sizes="(max-width: 640px) 70vw, 390px"
        />
        <div className="orb-image-vignette" />
        <div className="orb-energy-scan" />
        <div className="orb-voice-rings">
          <i />
          <i />
          <i />
        </div>
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
