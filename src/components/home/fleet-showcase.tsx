"use client";

import { useTranslations, useLocale } from "next-intl";
import { boats } from "@/lib/tour-data";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { Ruler, Users, Wifi, Wind } from "lucide-react";
import Image from "next/image";

export function FleetShowcase() {
  const t = useTranslations("fleet");
  const locale = useLocale();

  return (
    <section className="section-padding bg-[hsl(210,40%,98%)]">
      <div className="container-custom">
        <ScrollReveal>
          <SectionHeading
            title={t("sectionTitle")}
            subtitle={t("sectionSubtitle")}
          />
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {boats.map((boat, i) => {
            const key = boat.id as "tamaris" | "lovor" | "solo";
            return (
              <ScrollReveal key={boat.id} delay={i * 0.15}>
                <div className="bg-white rounded-2xl overflow-hidden border border-[hsl(214,20%,90%)] shadow-sm">
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={boat.image}
                      alt={t(`${key}.name`)}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <h3 className="text-2xl font-bold text-white">
                        {t(`${key}.name`)}
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-[hsl(215,15%,45%)] text-sm mb-4">
                      {locale === "hr" ? boat.description : boat.descriptionEn}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {boat.specs.slice(0, 4).map((spec, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-2 p-2.5 rounded-lg bg-[hsl(210,40%,98%)]"
                        >
                          <div className="h-8 w-8 rounded-full bg-[hsl(213,90%,45%)]/10 flex items-center justify-center">
                            {j === 0 && <Ruler className="h-4 w-4 text-[hsl(213,90%,45%)]" />}
                            {j === 1 && <Wind className="h-4 w-4 text-[hsl(213,90%,45%)]" />}
                            {j === 2 && <Users className="h-4 w-4 text-[hsl(213,90%,45%)]" />}
                            {j === 3 && <Wifi className="h-4 w-4 text-[hsl(213,90%,45%)]" />}
                          </div>
                          <div>
                            <div className="text-xs text-[hsl(215,15%,45%)]">
                              {locale === "hr" ? spec.label : spec.labelEn}
                            </div>
                            <div className="text-sm font-semibold text-[hsl(215,50%,12%)]">
                              {spec.value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
