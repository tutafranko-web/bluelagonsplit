"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { Anchor } from "lucide-react";

export function CtaSection() {
  const t = useTranslations("cta");

  return (
    <section className="py-20 bg-[hsl(213,90%,45%)] relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full border-2 border-white" />
        <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full border-2 border-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-white" />
      </div>

      <div className="container-custom relative z-10">
        <ScrollReveal>
          <div className="text-center">
            <Anchor className="h-12 w-12 mx-auto mb-6 text-[hsl(45,100%,50%)]" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t("title")}
            </h2>
            <p className="text-lg text-white/70 max-w-lg mx-auto mb-8">
              {t("subtitle")}
            </p>
            <Link
              href="/tours"
              className="inline-flex items-center px-8 py-3.5 rounded-full bg-[hsl(45,100%,50%)] text-[hsl(215,50%,12%)] font-semibold text-lg hover:bg-[hsl(45,100%,55%)] transition-colors shadow-lg animate-pulse-glow"
            >
              {t("button")}
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
