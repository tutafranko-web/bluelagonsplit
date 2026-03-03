"use client";

import { useTranslations, useLocale } from "next-intl";
import { boats } from "@/lib/tour-data";
import { SectionHeading } from "@/components/shared/section-heading";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { Anchor, Award, Heart, Shield } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  const t = useTranslations("about");
  const ft = useTranslations("fleet");
  const locale = useLocale();

  return (
    <div className="pt-24 pb-16">
      <div className="container-custom">
        <SectionHeading
          title={t("sectionTitle")}
          subtitle={t("sectionSubtitle")}
        />

        {/* Story */}
        <ScrollReveal>
          <div className="grid md:grid-cols-2 gap-10 items-center mt-8">
            <div>
              <p className="text-lg text-[hsl(215,15%,45%)] leading-relaxed mb-6">
                {t("story")}
              </p>
              <p className="text-lg text-[hsl(215,15%,45%)] leading-relaxed">
                {t("mission")}
              </p>
            </div>
            <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden">
              <Image
                src="/images/boats/tamaris-aerial-swimming.jpg"
                alt="Max Nautica"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </ScrollReveal>

        {/* Values */}
        <ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {[
              {
                icon: Anchor,
                titleHr: "Iskustvo",
                titleEn: "Experience",
                descHr: "Više od 10 godina na moru",
                descEn: "Over 10 years at sea",
              },
              {
                icon: Award,
                titleHr: "Kvaliteta",
                titleEn: "Quality",
                descHr: "1125+ pozitivnih recenzija",
                descEn: "1125+ positive reviews",
              },
              {
                icon: Heart,
                titleHr: "Strast",
                titleEn: "Passion",
                descHr: "Volimo ono što radimo",
                descEn: "We love what we do",
              },
              {
                icon: Shield,
                titleHr: "Sigurnost",
                titleEn: "Safety",
                descHr: "Sigurnost uvijek na prvom mjestu",
                descEn: "Safety always comes first",
              },
            ].map((val, i) => (
              <div
                key={i}
                className="text-center p-6 rounded-2xl bg-[hsl(210,40%,98%)] border border-[hsl(214,20%,90%)]"
              >
                <val.icon className="h-10 w-10 mx-auto mb-3 text-[hsl(213,90%,45%)]" />
                <h3 className="font-bold text-[hsl(215,50%,12%)] mb-1">
                  {locale === "hr" ? val.titleHr : val.titleEn}
                </h3>
                <p className="text-sm text-[hsl(215,15%,45%)]">
                  {locale === "hr" ? val.descHr : val.descEn}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Fleet */}
        <div className="mt-16">
          <ScrollReveal>
            <SectionHeading
              title={ft("sectionTitle")}
              subtitle={ft("sectionSubtitle")}
            />
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {boats.map((boat, i) => {
              const key = boat.id as "tamaris" | "lovor" | "solo";
              return (
                <ScrollReveal key={boat.id} delay={i * 0.15}>
                  <div className="bg-white rounded-2xl overflow-hidden border border-[hsl(214,20%,90%)] shadow-sm">
                    <div className="relative h-56 overflow-hidden">
                      <Image
                        src={boat.image}
                        alt={ft(`${key}.name`)}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-[hsl(215,50%,12%)] mb-2">
                        {ft(`${key}.name`)}
                      </h3>
                      <p className="text-sm text-[hsl(215,15%,45%)]">
                        {locale === "hr"
                          ? boat.description
                          : boat.descriptionEn}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
