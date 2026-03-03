"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export function RestaurantTeaser() {
  const t = useTranslations("restaurant");

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <ScrollReveal>
          <div className="relative rounded-2xl overflow-hidden h-[400px] md:h-[500px]">
            <Image
              src="/images/restaurant/skoy-outdoor-dining.jpg"
              alt={t("sectionTitle")}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

            <div className="absolute inset-0 flex items-center">
              <div className="p-8 md:p-12 max-w-lg">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  {t("sectionTitle")}
                </h2>
                <p className="text-white/80 text-lg mb-6">
                  {t("sectionSubtitle")}
                </p>
                <Link
                  href="/restaurant"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[hsl(45,100%,50%)] text-[hsl(215,50%,12%)] font-semibold hover:bg-[hsl(45,100%,55%)] transition-colors"
                >
                  {t("viewMore")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
