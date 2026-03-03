"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, ReactNode } from "react";

export function ParallaxSection({
  children,
  bgImage,
  speed = 0.3,
  className,
}: {
  children: ReactNode;
  bgImage?: string;
  speed?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [`-${speed * 100}px`, `${speed * 100}px`]
  );

  return (
    <div ref={ref} className={`relative overflow-hidden ${className || ""}`}>
      {bgImage && (
        <motion.div
          style={{ y }}
          className="absolute inset-0 -top-20 -bottom-20"
        >
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
        </motion.div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className,
}: {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: "easeOut" },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function TextReveal({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const words = text.split(" ");
  return (
    <motion.span
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      className={className}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          className="inline-block mr-[0.3em]"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

export function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{
        rotateX: -2,
        rotateY: 3,
        scale: 1.02,
        transition: { duration: 0.3 },
      }}
      style={{ transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
