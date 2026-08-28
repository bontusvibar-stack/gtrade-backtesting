"use client";
import { motion } from "framer-motion";
export function MotionDiv({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}
