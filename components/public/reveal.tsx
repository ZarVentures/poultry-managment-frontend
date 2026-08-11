"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: "up" | "left" | "right" | "none"
}

export function Reveal({ children, className, delay = 0, direction = "up" }: RevealProps) {
  const offset = 24
  const initial = {
    opacity: 0,
    y: direction === "up" ? offset : direction === "none" ? 0 : 0,
    x: direction === "left" ? offset : direction === "right" ? -offset : 0,
  }

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
