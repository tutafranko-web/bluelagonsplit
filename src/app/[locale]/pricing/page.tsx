"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { tours } from "@/lib/tour-data";
import { SectionHeading } from "@/components/shared/section-heading";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { PHONE_DISPLAY, PHONE_NUMBER } from "@/lib/constants";
import {
  Check,
  Star,
  Clock,
  Ship,
  ArrowRight,
  Phone,
  ExternalLink,
} from "lucide-react";

export default function PricingPage() {
  const t = useTranslations("pricing");
  const tt = useTranslations("tours");
  const locale = useLocale();

  return (
    <div className="pt-24 pb-16">
      <div className="container-custom">
        <SectionHeading
          title={t("sectionTitle")}
          subtitle={t("sectionSubtitle")}
        />

        {/* Tour Price Cards */}
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          {tours.map((tour, i) => {
            const tourKey =
              tour.id === "split-tour" ? "splitTour" : "trogirTour";
            return (
              <ScrollReveal key={tour.id} delay={i * 0.15}>
                <div className="bg-white rounded-2xl border border-[hsl(214,20%,90%)] shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="bg-[hsl(213,90%,45%)] text-white p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Ship className="h-5 w-5" />
                      <span className="text-sm font-medium text-white/80">
                        {tour.boatName} &middot; {tt(`${tourKey}.departure`)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">
                      {tt(`${tourKey}.name`)}
                    </h3>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-3xl font-bold">
                        {tour.priceFrom}
                        {tour.priceTo ? `–${tour.priceTo}` : ""} EUR
                      </span>
                      <span className="text-sm text-white/70">
                        {tt("perPerson")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-white/80">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {tour.duration} {tt("hours")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-[hsl(45,100%,50%)] text-[hsl(45,100%,50%)]" />
                        {tour.rating} ({tour.reviewCount})
                      </span>
                    </div>
                  </div>

                  {/* Inclusions */}
                  <div className="p-6">
                    <h4 className="font-semibold text-[hsl(215,50%,12%)] mb-3">
                      {tt("included")}
                    </h4>
                    <ul className="space-y-2 mb-6">
                      {tour.inclusions.map((inc, j) => (
                        <li
                          key={j}
                          className="flex items-center gap-2 text-sm text-[hsl(215,15%,45%)]"
                        >
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          {locale === "hr" ? inc.text : inc.textEn}
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-col gap-2">
                      <a
                        href={tour.getYourGuideUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[hsl(45,100%,50%)] text-[hsl(215,50%,12%)] font-semibold hover:bg-[hsl(45,100%,55%)] transition-colors"
                      >
                        {tt("bookTour")}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Link
                        href={`/tours/${tour.slug}`}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-[hsl(214,20%,90%)] text-[hsl(213,90%,45%)] font-semibold hover:bg-[hsl(210,20%,96%)] transition-colors"
                      >
                        {tt("viewDetails")}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Charter Pricing */}
        <ScrollReveal>
          <div className="mt-12 p-8 rounded-2xl border-2 border-dashed border-[hsl(213,90%,45%)]/30 bg-[hsl(213,90%,45%)]/5 text-center">
            <h3 className="text-2xl font-bold text-[hsl(215,50%,12%)] mb-3">
              {t("charterTitle")}
            </h3>
            <p className="text-[hsl(215,15%,45%)] mb-6 max-w-lg mx-auto">
              {t("charterOnRequest")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`tel:${PHONE_NUMBER}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[hsl(213,90%,45%)] text-white font-semibold hover:bg-[hsl(213,90%,40%)] transition-colors"
              >
                <Phone className="h-4 w-4" />
                {PHONE_DISPLAY}
              </a>
              <Link
                href="/private-tours"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[hsl(213,90%,45%)] text-[hsl(213,90%,45%)] font-semibold hover:bg-[hsl(213,90%,45%)]/5 transition-colors"
              >
                {locale === "hr" ? "Pošalji upit" : "Send Inquiry"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
