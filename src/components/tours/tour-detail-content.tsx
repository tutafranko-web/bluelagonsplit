"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { getTourBySlug } from "@/lib/tour-data";
import { PHONE_DISPLAY, PHONE_NUMBER } from "@/lib/constants";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import {
  Clock,
  Star,
  MapPin,
  ArrowLeft,
  Check,
  AlertCircle,
  ExternalLink,
  Phone,
  Coffee,
  UtensilsCrossed,
  Wine,
  Waves,
  Wifi,
  ShowerHead,
  Apple,
  Beer,
  GlassWater,
  Music,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Coffee,
  UtensilsCrossed,
  Wine,
  Waves,
  Wifi,
  ShowerHead,
  Apple,
  Beer,
  GlassWater,
  Music,
};

interface TourDetailContentProps {
  tourSlug: string;
}

export function TourDetailContent({ tourSlug }: TourDetailContentProps) {
  const t = useTranslations("tours");
  const locale = useLocale();
  const tour = getTourBySlug(tourSlug);

  if (!tour) return notFound();

  const tourKey = tour.id === "split-tour" ? "splitTour" : "trogirTour";
  const isHr = locale === "hr";

  return (
    <div className="pt-20">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[400px]">
        <Image
          src={tour.heroImage}
          alt={t(`${tourKey}.name`)}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="container-custom">
            <Link
              href="/tours"
              className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {isHr ? "Svi izleti" : "All Tours"}
            </Link>
            <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
              <MapPin className="h-4 w-4" />
              {t(`${tourKey}.departure`)} &middot; {tour.boatName}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
              {t(`${tourKey}.name`)}
            </h1>
            <p className="text-[hsl(45,100%,50%)] font-medium text-lg">
              {t(`${tourKey}.tagline`)}
            </p>
            <div className="flex items-center gap-4 mt-4 text-white">
              <span className="flex items-center gap-1.5">
                <Star className="h-5 w-5 fill-[hsl(45,100%,50%)] text-[hsl(45,100%,50%)]" />
                <strong>{tour.rating}</strong>
                <span className="text-white/70">
                  ({tour.reviewCount} {t("reviews")})
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-5 w-5" />
                {tour.duration} {t("hours")}
              </span>
              <span className="text-2xl font-bold">
                {t("from")} {tour.priceFrom}
                {tour.priceTo ? `-${tour.priceTo}` : ""} EUR
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <ScrollReveal>
              <p className="text-lg text-[hsl(215,15%,45%)] leading-relaxed">
                {t(`${tourKey}.description`)}
              </p>
            </ScrollReveal>

            {/* Itinerary */}
            <ScrollReveal>
              <h2 className="text-2xl font-bold text-[hsl(215,50%,12%)] mb-6">
                {t("itinerary")}
              </h2>
              <div className="space-y-0">
                {tour.stops.map((stop, i) => (
                  <div key={i} className="flex gap-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-[hsl(213,90%,45%)] text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {i + 1}
                      </div>
                      {i < tour.stops.length - 1 && (
                        <div className="w-0.5 flex-1 bg-[hsl(213,90%,45%)]/20 my-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-8">
                      <h3 className="font-semibold text-[hsl(215,50%,12%)]">
                        {isHr ? stop.name : stop.nameEn}
                      </h3>
                      <p className="text-sm text-[hsl(213,90%,45%)] font-medium">
                        {stop.duration}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(isHr ? stop.activities : stop.activitiesEn).map(
                          (act, j) => (
                            <span
                              key={j}
                              className="px-2.5 py-1 text-xs rounded-full bg-[hsl(210,40%,98%)] text-[hsl(215,15%,45%)] border border-[hsl(214,20%,90%)]"
                            >
                              {act}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* Inclusions */}
            <ScrollReveal>
              <h2 className="text-2xl font-bold text-[hsl(215,50%,12%)] mb-6">
                {t("included")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {tour.inclusions.map((inc, i) => {
                  const IconComp = iconMap[inc.icon];
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(210,40%,98%)] border border-[hsl(214,20%,90%)]"
                    >
                      <div className="w-9 h-9 rounded-full bg-[hsl(213,90%,45%)]/10 flex items-center justify-center shrink-0">
                        {IconComp ? (
                          <IconComp className="h-4.5 w-4.5 text-[hsl(213,90%,45%)]" />
                        ) : (
                          <Check className="h-4.5 w-4.5 text-[hsl(213,90%,45%)]" />
                        )}
                      </div>
                      <span className="text-sm text-[hsl(215,50%,12%)]">
                        {isHr ? inc.text : inc.textEn}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>

            {/* Gallery */}
            <ScrollReveal>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {tour.images.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden"
                  >
                    <Image
                      src={img}
                      alt={`${t(`${tourKey}.name`)} - ${i + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <ScrollReveal>
              <div className="sticky top-24 bg-white rounded-2xl border border-[hsl(214,20%,90%)] shadow-lg p-6 space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[hsl(215,50%,12%)]">
                    {t("from")} {tour.priceFrom}
                    {tour.priceTo ? `–${tour.priceTo}` : ""} EUR
                  </div>
                  <div className="text-sm text-[hsl(215,15%,45%)]">
                    {t("perPerson")}
                  </div>
                </div>

                <a
                  href={tour.getYourGuideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[hsl(45,100%,50%)] text-[hsl(215,50%,12%)] font-semibold hover:bg-[hsl(45,100%,55%)] transition-colors"
                >
                  {t("bookTour")}
                  <ExternalLink className="h-4 w-4" />
                </a>

                <a
                  href={`tel:${PHONE_NUMBER}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[hsl(213,90%,45%)] text-[hsl(213,90%,45%)] font-semibold hover:bg-[hsl(213,90%,45%)]/5 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {PHONE_DISPLAY}
                </a>

                <div className="pt-4 border-t border-[hsl(214,20%,90%)]">
                  <p className="text-xs text-[hsl(215,15%,45%)] text-center">
                    {isHr
                      ? "Besplatno otkazivanje do 24h unaprijed"
                      : "Free cancellation up to 24h in advance"}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Meeting Point */}
            <ScrollReveal>
              <div className="bg-white rounded-2xl border border-[hsl(214,20%,90%)] p-6">
                <h3 className="font-semibold text-[hsl(215,50%,12%)] mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[hsl(213,90%,45%)]" />
                  {t("meetingPoint")}
                </h3>
                <p className="text-sm text-[hsl(215,15%,45%)]">
                  {isHr
                    ? tour.meetingPoint.description
                    : tour.meetingPoint.descriptionEn}
                </p>
              </div>
            </ScrollReveal>

            {/* Important Info */}
            <ScrollReveal>
              <div className="bg-[hsl(45,100%,50%)]/10 rounded-2xl border border-[hsl(45,100%,50%)]/30 p-6">
                <h3 className="font-semibold text-[hsl(215,50%,12%)] mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[hsl(45,100%,40%)]" />
                  {t("importantInfo")}
                </h3>
                <ul className="space-y-2">
                  {(isHr
                    ? tour.importantInfo
                    : tour.importantInfoEn
                  ).map((info, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[hsl(215,15%,45%)]"
                    >
                      <span className="text-[hsl(45,100%,40%)] mt-0.5">
                        &bull;
                      </span>
                      {info}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
