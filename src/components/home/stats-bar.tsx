"use client";

import { useTranslations } from "next-intl";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Calendar, Star, Ship, Users } from "lucide-react";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsBar() {
  const t = useTranslations("stats");

  const stats = [
    { icon: Calendar, value: 10, suffix: "+", label: t("years") },
    { icon: Star, value: 1125, suffix: "+", label: t("reviews") },
    { icon: Ship, value: 3, suffix: "", label: t("boats") },
    { icon: Users, value: 10000, suffix: "+", label: t("guests") },
  ];

  return (
    <section className="relative -mt-16 z-20">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl border border-[hsl(214,20%,90%)] p-6 sm:p-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-[hsl(213,90%,45%)]" />
                <div className="text-2xl sm:text-3xl font-bold text-[hsl(215,50%,12%)]">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-[hsl(215,15%,45%)] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
