"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { TextReveal } from "@/components/shared/animations";
import { useRef, useState, useCallback } from "react";

export function HeroVideo() {
  const t = useTranslations("hero");
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const [showSecondVideo, setShowSecondVideo] = useState(false);

  const handleFirstVideoEnd = useCallback(() => {
    setShowSecondVideo(true);
    if (video2Ref.current) {
      video2Ref.current.currentTime = 0;
      video2Ref.current.play().catch(() => {});
    }
  }, []);

  const handleSecondVideoEnd = useCallback(() => {
    setShowSecondVideo(false);
    if (video1Ref.current) {
      video1Ref.current.currentTime = 0;
      video1Ref.current.play().catch(() => {});
    }
  }, []);

  return (
    <section className="relative h-screen overflow-hidden bg-[hsl(45,100%,50%)]">
      {/* Video 1 — Ocean waves (plays once) */}
      <video
        ref={video1Ref}
        autoPlay
        muted
        playsInline
        onEnded={handleFirstVideoEnd}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1500 ${
          showSecondVideo ? "opacity-0" : "opacity-100"
        }`}
        poster="/images/boats/tamaris-aerial-swimming.jpg"
      >
        <source src="/videos/hero-sea.mp4" type="video/mp4" />
      </video>

      {/* Video 2 — Adjustments video (plays once, then swaps back to V1) */}
      <video
        ref={video2Ref}
        muted
        playsInline
        preload="auto"
        onEnded={handleSecondVideoEnd}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1500 ${
          showSecondVideo ? "opacity-100" : "opacity-0"
        }`}
      >
        <source src="/videos/video-adjustments.mp4" type="video/mp4" />
      </video>

      {/* Gradient Overlay */}
      <div className="hero-gradient absolute inset-0" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl leading-tight">
          <TextReveal text={t("title")} />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl"
        >
          {t("subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-8 flex flex-col sm:flex-row gap-4"
        >
          <Link
            href="/tours"
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-full bg-[hsl(45,100%,50%)] text-[hsl(215,50%,12%)] hover:bg-[hsl(45,100%,55%)] transition-colors shadow-lg animate-pulse-glow"
          >
            {t("cta")}
          </Link>
          <a
            href="#tours-preview"
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-full border-2 border-white/30 text-white hover:bg-white/10 transition-colors"
          >
            {t("scrollDown")}
          </a>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <ChevronDown className="h-6 w-6 text-white/50 animate-bounce" />
      </motion.div>
    </section>
  );
}
