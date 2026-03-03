"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SectionHeading } from "@/components/shared/section-heading";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { PHONE_DISPLAY, PHONE_NUMBER } from "@/lib/constants";
import {
  Heart,
  Building2,
  Users,
  PartyPopper,
  Ship,
  UtensilsCrossed,
  Phone,
  Send,
  Calendar,
  Mail,
  User,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";

export default function PrivateToursPage() {
  const t = useTranslations("privateTours");
  const locale = useLocale();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    date: "",
    guests: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const eventTypes = [
    { icon: Heart, key: "weddings" },
    { icon: Building2, key: "events" },
    { icon: Users, key: "teamBuilding" },
    { icon: PartyPopper, key: "celebrations" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Placeholder - will connect to n8n or email later
    await new Promise((r) => setTimeout(r, 1000));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <div className="relative h-[40vh] min-h-[300px] mb-12">
        <Image
          src="/images/boats/tamaris-bar-night.jpg"
          alt={t("sectionTitle")}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="container-custom">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              {t("sectionTitle")}
            </h1>
            <p className="text-lg text-white/80 max-w-xl">
              {t("sectionSubtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom">
        {/* Event Types */}
        <ScrollReveal>
          <p className="text-lg text-[hsl(215,15%,45%)] text-center max-w-2xl mx-auto mb-10">
            {t("description")}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {eventTypes.map((ev) => (
              <div
                key={ev.key}
                className="text-center p-6 rounded-2xl bg-[hsl(210,40%,98%)] border border-[hsl(214,20%,90%)] hover:shadow-md transition-shadow"
              >
                <ev.icon className="h-10 w-10 mx-auto mb-3 text-[hsl(213,90%,45%)]" />
                <h3 className="font-semibold text-[hsl(215,50%,12%)]">
                  {t(ev.key)}
                </h3>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Pricing Placeholders */}
        <ScrollReveal>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="p-8 rounded-2xl border-2 border-dashed border-[hsl(213,90%,45%)]/30 bg-[hsl(213,90%,45%)]/5 text-center">
              <Ship className="h-12 w-12 mx-auto mb-4 text-[hsl(213,90%,45%)]/40" />
              <h3 className="text-xl font-semibold text-[hsl(215,50%,12%)] mb-2">
                {t("charterPricing")}
              </h3>
              <p className="text-[hsl(215,15%,45%)] mb-4">
                {t("pricingOnRequest")}
              </p>
              <a
                href={`tel:${PHONE_NUMBER}`}
                className="inline-flex items-center gap-2 text-[hsl(213,90%,45%)] font-semibold"
              >
                <Phone className="h-4 w-4" />
                {PHONE_DISPLAY}
              </a>
            </div>
            <div className="p-8 rounded-2xl border-2 border-dashed border-[hsl(45,100%,50%)]/30 bg-[hsl(45,100%,50%)]/5 text-center">
              <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-[hsl(45,100%,40%)]/40" />
              <h3 className="text-xl font-semibold text-[hsl(215,50%,12%)] mb-2">
                {t("foodDrink")}
              </h3>
              <p className="text-[hsl(215,15%,45%)]">{t("menuOnRequest")}</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Inquiry Form */}
        <ScrollReveal>
          <div className="max-w-2xl mx-auto">
            <SectionHeading
              title={t("contactForQuote")}
            />

            {submitted ? (
              <div className="text-center p-10 rounded-2xl bg-green-50 border border-green-200">
                <p className="text-green-700 text-lg font-semibold">
                  {locale === "hr"
                    ? "Hvala! Vaš upit je poslan. Javit ćemo vam se uskoro."
                    : "Thank you! Your inquiry has been sent. We'll get back to you soon."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-[hsl(215,50%,12%)] mb-1.5">
                      <User className="h-4 w-4 text-[hsl(213,90%,45%)]" />
                      {locale === "hr" ? "Ime i prezime" : "Full Name"} *
                    </label>
                    <input
                      required
                      value={formState.name}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, name: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[hsl(214,20%,90%)] bg-white focus:ring-2 focus:ring-[hsl(213,90%,45%)]/30 focus:border-[hsl(213,90%,45%)] outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-[hsl(215,50%,12%)] mb-1.5">
                      <Mail className="h-4 w-4 text-[hsl(213,90%,45%)]" />
                      Email *
                    </label>
                    <input
                      required
                      type="email"
                      value={formState.email}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, email: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[hsl(214,20%,90%)] bg-white focus:ring-2 focus:ring-[hsl(213,90%,45%)]/30 focus:border-[hsl(213,90%,45%)] outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-[hsl(215,50%,12%)] mb-1.5">
                      <Phone className="h-4 w-4 text-[hsl(213,90%,45%)]" />
                      {locale === "hr" ? "Telefon" : "Phone"}
                    </label>
                    <input
                      value={formState.phone}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, phone: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[hsl(214,20%,90%)] bg-white focus:ring-2 focus:ring-[hsl(213,90%,45%)]/30 focus:border-[hsl(213,90%,45%)] outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-[hsl(215,50%,12%)] mb-1.5">
                      <Calendar className="h-4 w-4 text-[hsl(213,90%,45%)]" />
                      {locale === "hr" ? "Željeni datum" : "Preferred Date"}
                    </label>
                    <input
                      type="date"
                      value={formState.date}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, date: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[hsl(214,20%,90%)] bg-white focus:ring-2 focus:ring-[hsl(213,90%,45%)]/30 focus:border-[hsl(213,90%,45%)] outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[hsl(215,50%,12%)] mb-1.5 block">
                      {locale === "hr" ? "Vrsta eventa" : "Event Type"}
                    </label>
                    <select
                      value={formState.eventType}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          eventType: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[hsl(214,20%,90%)] bg-white focus:ring-2 focus:ring-[hsl(213,90%,45%)]/30 focus:border-[hsl(213,90%,45%)] outline-none text-sm"
                    >
                      <option value="">
                        {locale === "hr" ? "Odaberite..." : "Select..."}
                      </option>
                      <option value="wedding">{t("weddings")}</option>
                      <option value="corporate">{t("events")}</option>
                      <option value="teambuilding">{t("teamBuilding")}</option>
                      <option value="celebration">{t("celebrations")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[hsl(215,50%,12%)] mb-1.5 block">
                      {locale === "hr" ? "Broj gostiju" : "Number of Guests"}
                    </label>
                    <input
                      type="number"
                      value={formState.guests}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, guests: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[hsl(214,20%,90%)] bg-white focus:ring-2 focus:ring-[hsl(213,90%,45%)]/30 focus:border-[hsl(213,90%,45%)] outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-[hsl(215,50%,12%)] mb-1.5">
                    <MessageSquare className="h-4 w-4 text-[hsl(213,90%,45%)]" />
                    {locale === "hr" ? "Poruka" : "Message"}
                  </label>
                  <textarea
                    rows={4}
                    value={formState.message}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, message: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[hsl(214,20%,90%)] bg-white focus:ring-2 focus:ring-[hsl(213,90%,45%)]/30 focus:border-[hsl(213,90%,45%)] outline-none text-sm resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[hsl(213,90%,45%)] text-white font-semibold hover:bg-[hsl(213,90%,40%)] disabled:opacity-50 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting
                    ? locale === "hr"
                      ? "Šalje se..."
                      : "Sending..."
                    : locale === "hr"
                      ? "Pošalji upit"
                      : "Send Inquiry"}
                </button>
              </form>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
