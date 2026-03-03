"use client";

import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { StaggerContainer, StaggerItem } from "@/components/shared/animations";
import { Star, Quote } from "lucide-react";

const reviews = [
  {
    name: "Martina L.",
    rating: 5,
    textHr:
      "Plava laguna i Šolta. Odličan izlet, omjer cijene i kvalitete je top. Cijela ekipa na brodu je za svaku pohvalu — raspoloženi, ljubazni i spremni pomoći. Atmosfera na brodu ugodna i opuštena.",
    textEn:
      "Blue Lagoon and Šolta. Excellent trip, great value for money. The entire crew on board is commendable — cheerful, kind, and ready to help. The atmosphere on the boat was pleasant and relaxed.",
    tour: "Split",
  },
  {
    name: "Andrea B.",
    rating: 5,
    textHr:
      "Jako lijepo putovanje, sa jako ljubaznim osobljem. Sasvim dovoljno vremena za kupanje, obilazak itd. Ručak je bio više nego obilan, nismo mogli ni pojesti sve. A tek lubenica nakon puno plivanja!",
    textEn:
      "A very nice trip with very friendly staff. Plenty of time for swimming, sightseeing etc. Lunch was more than abundant, we couldn't even eat it all. And the watermelon after lots of swimming!",
    tour: "Trogir",
  },
  {
    name: "Lucija K.",
    rating: 5,
    textHr:
      "Cijela ekipa i krstarenje su bili super, ali posebne pohvale momcima Luki, Nikoli i Karlu. Definitivno preporučujem!",
    textEn:
      "The entire crew and the cruise were great, special kudos to Luka, Nikola and Karlo. Definitely recommend!",
    tour: "Trogir",
  },
];

export function Testimonials() {
  const t = useTranslations("testimonials");

  return (
    <section className="section-padding bg-[hsl(210,40%,98%)]">
      <div className="container-custom">
        <ScrollReveal>
          <SectionHeading
            title={t("sectionTitle")}
            subtitle={t("sectionSubtitle")}
          />
        </ScrollReveal>

        <StaggerContainer className="grid md:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <StaggerItem key={i}>
              <div className="bg-white rounded-2xl p-6 border border-[hsl(214,20%,90%)] shadow-sm h-full flex flex-col">
                <Quote className="h-8 w-8 text-[hsl(213,90%,45%)]/20 mb-3" />

                <p className="text-sm text-[hsl(215,15%,45%)] flex-1 mb-4">
                  &ldquo;<span className="review-hr">{review.textHr}</span>&rdquo;
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-[hsl(214,20%,90%)]">
                  <div>
                    <div className="font-semibold text-sm text-[hsl(215,50%,12%)]">
                      {review.name}
                    </div>
                    <div className="text-xs text-[hsl(215,15%,45%)]">
                      {review.tour} tour
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: review.rating }).map((_, j) => (
                      <Star
                        key={j}
                        className="h-4 w-4 fill-[hsl(45,100%,50%)] text-[hsl(45,100%,50%)]"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
