"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { tours } from "@/lib/tour-data";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { TiltCard } from "@/components/shared/animations";
import { Clock, Star, MapPin, ArrowRight } from "lucide-react";
import Image from "next/image";

export function ToursPreview() {
  const t = useTranslations("tours");
  const locale = useLocale();

  return (
    <section id="tours-preview" className="section-padding bg-white">
      <div className="container-custom">
        <ScrollReveal>
          <SectionHeading
            title={t("sectionTitle")}
            subtitle={t("sectionSubtitle")}
          />
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {tours.map((tour, i) => {
            const isHr = locale === "hr";
            const tourKey = tour.id === "split-tour" ? "splitTour" : "trogirTour";

            return (
              <ScrollReveal key={tour.id} delay={i * 0.15}>
                <TiltCard>
                  <Link
                    href={`/tours/${tour.slug}`}
                    className="group block bg-white rounded-2xl overflow-hidden border border-[hsl(214,20%,90%)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Image */}
                    <div className="relative h-64 sm:h-72 overflow-hidden">
                      <Image
                        src={tour.heroImage}
                        alt={t(`${tourKey}.name`)}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Price Badge */}
                      <div className="absolute top-4 right-4 bg-[hsl(45,100%,50%)] text-[hsl(215,50%,12%)] px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                        {t("from")} {tour.priceFrom} EUR
                      </div>

                      {/* Rating */}
                      <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white">
                        <Star className="h-4 w-4 fill-[hsl(45,100%,50%)] text-[hsl(45,100%,50%)]" />
                        <span className="font-semibold">{tour.rating}</span>
                        <span className="text-white/70 text-sm">
                          ({tour.reviewCount} {t("reviews")})
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center gap-2 text-sm text-[hsl(213,90%,45%)] font-medium mb-2">
                        <MapPin className="h-4 w-4" />
                        {isHr ? tour.departureCity : tour.departureCityEn} &middot; {tour.boatName}
                      </div>

                      <h3 className="text-xl font-bold text-[hsl(215,50%,12%)] mb-1">
                        {t(`${tourKey}.name`)}
                      </h3>
                      <p className="text-sm text-[hsl(45,100%,40%)] font-medium mb-3">
                        {t(`${tourKey}.tagline`)}
                      </p>

                      <p className="text-sm text-[hsl(215,15%,45%)] line-clamp-2 mb-4">
                        {t(`${tourKey}.description`)}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-sm text-[hsl(215,15%,45%)]">
                          <Clock className="h-4 w-4" />
                          {tour.duration} {t("hours")}
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(213,90%,45%)] group-hover:gap-2 transition-all">
                          {t("viewDetails")}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </TiltCard>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
