"use client";

import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { UtensilsCrossed, TreePine, Waves, MapPin } from "lucide-react";
import Image from "next/image";

const restaurantImages = [
  "/images/restaurant/skoy-outdoor-dining.jpg",
  "/images/restaurant/skoy-grilled-fish.jpg",
  "/images/restaurant/skoy-friends-dining.jpg",
  "/images/tours/pine-restaurant.jpg",
  "/images/tours/bar-vintage-bicycle.jpg",
  "/images/tours/beach-aerial.jpg",
];

export default function RestaurantPage() {
  const t = useTranslations("restaurant");

  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <div className="relative h-[45vh] min-h-[350px] mb-12">
        <Image
          src="/images/restaurant/skoy-outdoor-dining.jpg"
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
        {/* Description */}
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-lg text-[hsl(215,15%,45%)] leading-relaxed">
              {t("description")}
            </p>
          </div>
        </ScrollReveal>

        {/* Features */}
        <ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: TreePine, labelHr: "Pod stoljetnim borovima", labelEn: "Under century-old pines" },
              { icon: UtensilsCrossed, labelHr: "Svježa riba s roštilja", labelEn: "Fresh grilled fish" },
              { icon: Waves, labelHr: "Kristalno čisto more", labelEn: "Crystal-clear sea" },
              { icon: MapPin, labelHr: "U srcu Plave lagune", labelEn: "Heart of Blue Lagoon" },
            ].map((feat, i) => (
              <div
                key={i}
                className="text-center p-5 rounded-2xl bg-[hsl(210,40%,98%)] border border-[hsl(214,20%,90%)]"
              >
                <feat.icon className="h-8 w-8 mx-auto mb-2 text-[hsl(213,90%,45%)]" />
                <p className="text-sm font-medium text-[hsl(215,50%,12%)]">
                  {feat.labelHr}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Gallery */}
        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {restaurantImages.map((img, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl ${
                  i === 0 ? "row-span-2 aspect-[3/4]" : "aspect-[4/3]"
                }`}
              >
                <Image
                  src={img}
                  alt={`Restaurant Skoy - ${i + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Menu Placeholder */}
        <ScrollReveal>
          <div className="mt-12 text-center p-10 rounded-2xl border-2 border-dashed border-[hsl(213,90%,45%)]/30 bg-[hsl(213,90%,45%)]/5">
            <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-[hsl(213,90%,45%)]/40" />
            <h3 className="text-xl font-semibold text-[hsl(215,50%,12%)] mb-2">
              {t("menuTitle")}
            </h3>
            <p className="text-[hsl(215,15%,45%)]">{t("menuComingSoon")}</p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
