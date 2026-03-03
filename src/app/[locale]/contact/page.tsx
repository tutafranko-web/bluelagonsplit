"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SectionHeading } from "@/components/shared/section-heading";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { PHONE_DISPLAY, PHONE_NUMBER, SOCIAL_LINKS } from "@/lib/constants";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  Facebook,
  Instagram,
  Clock,
} from "lucide-react";

export default function ContactPage() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="pt-24 pb-16">
      <div className="container-custom">
        <SectionHeading
          title={t("sectionTitle")}
          subtitle={t("sectionSubtitle")}
        />

        <div className="grid lg:grid-cols-5 gap-10 mt-8">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <ScrollReveal>
              <div className="bg-[hsl(213,90%,45%)] text-white rounded-2xl p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 mt-0.5 text-[hsl(45,100%,50%)]" />
                  <div>
                    <h3 className="font-semibold mb-1">{t("orCallUs")}</h3>
                    <a
                      href={`tel:${PHONE_NUMBER}`}
                      className="text-lg font-bold hover:text-[hsl(45,100%,50%)] transition-colors"
                    >
                      {PHONE_DISPLAY}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 mt-0.5 text-[hsl(45,100%,50%)]" />
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a
                      href="mailto:info@maxnautica.hr"
                      className="hover:text-[hsl(45,100%,50%)] transition-colors"
                    >
                      info@maxnautica.hr
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-0.5 text-[hsl(45,100%,50%)]" />
                  <div>
                    <h3 className="font-semibold mb-1">
                      {locale === "hr" ? "Lokacije" : "Locations"}
                    </h3>
                    <p className="text-sm text-white/80">
                      Split Riva (Stand #8)
                    </p>
                    <p className="text-sm text-white/80">
                      Trogir (Hotel Vila Sikaa)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 mt-0.5 text-[hsl(45,100%,50%)]" />
                  <div>
                    <h3 className="font-semibold mb-1">
                      {locale === "hr" ? "Radno vrijeme" : "Working Hours"}
                    </h3>
                    <p className="text-sm text-white/80">
                      {locale === "hr"
                        ? "Svaki dan 08:00 - 20:00 (sezona)"
                        : "Every day 08:00 - 20:00 (season)"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/20">
                  <h3 className="font-semibold mb-3">{t("followUs")}</h3>
                  <div className="flex gap-3">
                    <a
                      href={SOCIAL_LINKS.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                    <a
                      href={SOCIAL_LINKS.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <ScrollReveal>
              {submitted ? (
                <div className="text-center p-10 rounded-2xl bg-green-50 border border-green-200">
                  <p className="text-green-700 text-lg font-semibold">
                    {t("success")}
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-white rounded-2xl border border-[hsl(214,20%,90%)] p-6 md:p-8 space-y-4"
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[hsl(215,50%,12%)] mb-1.5 block">
                        {t("name")} *
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
                      <label className="text-sm font-medium text-[hsl(215,50%,12%)] mb-1.5 block">
                        {t("email")} *
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
                      <label className="text-sm font-medium text-[hsl(215,50%,12%)] mb-1.5 block">
                        {t("phone")}
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
                      <label className="text-sm font-medium text-[hsl(215,50%,12%)] mb-1.5 block">
                        {t("subject")}
                      </label>
                      <input
                        value={formState.subject}
                        onChange={(e) =>
                          setFormState((s) => ({
                            ...s,
                            subject: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-[hsl(214,20%,90%)] bg-white focus:ring-2 focus:ring-[hsl(213,90%,45%)]/30 focus:border-[hsl(213,90%,45%)] outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[hsl(215,50%,12%)] mb-1.5 block">
                      {t("message")} *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formState.message}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          message: e.target.value,
                        }))
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
                    {isSubmitting ? t("sending") : t("send")}
                  </button>
                </form>
              )}
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
