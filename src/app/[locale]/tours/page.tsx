"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { tours } from "@/lib/tour-data";
import { SectionHeading } from "@/components/shared/section-heading";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import {
  Clock,
  Star,
  MapPin,
  ArrowRight,
  Check,
  Ship,
} from "lucide-react";
import Image from "next/image";

export default function ToursPage() {
  const t = useTranslations("tours");
  const locale = useLocale();

  return (
    <div className="pt-24 pb-16">
      <div className="container-custom">
        <SectionHeading
          title={t("sectionTitle")}
          subtitle={t("sectionSubtitle")}
        />

        <div className="grid md:grid-cols-2 gap-8 mt-8">
          {tours.map((tour, i) => {
            const tourKey =
              tour.id === "split-tour" ? "splitTour" : "trogirTour";
            return (
              <ScrollReveal key={tour.id} delay={i * 0.15}>
                <div className="bg-white rounded-2xl overflow-hidden border border-[hsl(214,20%,90%)] shadow-sm hover:shadow-xl transition-all duration-300">
                  {/* Image */}
                  <div className="relative h-72 overflow-hidden">
                    <Image
                      src={tour.heroImage}
                      alt={t(`${tourKey}.name`)}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 right-4 bg-[hsl(45,100%,50%)] text-[hsl(215,50%,12%)] px-4 py-2 rounded-full font-bold shadow-lg">
                      {t("from")} {tour.priceFrom} EUR
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <div className="flex items-center gap-2 text-white mb-1">
                        <Ship className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {tour.boatName} ({tour.boatLength})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white">
                        <Star className="h-4 w-4 fill-[hsl(45,100%,50%)] text-[hsl(45,100%,50%)]" />
                        <span className="font-semibold">{tour.rating}</span>
                        <span className="text-white/70 text-sm">
                          ({tour.reviewCount} {t("reviews")})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-[hsl(213,90%,45%)] font-medium mb-2">
                      <MapPin className="h-4 w-4" />
                      {t(`${tourKey}.departure`)}
                    </div>

                    <h2 className="text-xl font-bold text-[hsl(215,50%,12%)] mb-1">
                      {t(`${tourKey}.name`)}
                    </h2>
                    <p className="text-sm text-[hsl(45,100%,40%)] font-medium mb-3">
                      {t(`${tourKey}.tagline`)}
                    </p>

                    <p className="text-sm text-[hsl(215,15%,45%)] mb-4">
                      {t(`${tourKey}.description`)}
                    </p>

                    {/* Quick info */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-[hsl(215,15%,45%)]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {tour.duration} {t("hours")}
                      </span>
                    </div>

                    {/* Inclusions preview */}
                    <div className="grid grid-cols-2 gap-1.5 mb-5">
                      {tour.inclusions.slice(0, 4).map((inc, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-1.5 text-xs text-[hsl(215,15%,45%)]"
                        >
                          <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          {locale === "hr" ? inc.text : inc.textEn}
                        </div>
                      ))}
                    </div>

                    <Link
                      href={`/tours/${tour.slug}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[hsl(213,90%,45%)] text-white font-semibold hover:bg-[hsl(213,90%,40%)] transition-colors"
                    >
                      {t("viewDetails")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
