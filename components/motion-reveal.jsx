"use client";

import { motion, useReducedMotion } from "motion/react";

export function Reveal({ children, className, delay = 0, direction = "up", amount = 0.15, onLoad = false, ...props }) {
  const reduceMotion = useReducedMotion();
  const offset = direction === "left" ? { x: -24 } : direction === "right" ? { x: 24 } : { y: 22 };
  const initial = reduceMotion ? false : { opacity: 0, ...offset };
  const visible = reduceMotion ? undefined : { opacity: 1, x: 0, y: 0 };
  return <motion.div className={className} initial={initial} {...(onLoad ? { animate: visible || { opacity: 1 } } : { whileInView: visible })} viewport={{ once: true, amount }} transition={{ duration: 0.72, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }} {...props}>{children}</motion.div>;
}

export function MotionSection({ children, className, delay = 0, ...props }) {
  return <Reveal className={className} delay={delay} {...props}>{children}</Reveal>;
}
