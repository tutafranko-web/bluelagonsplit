"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/shared/section-heading";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

type Category = "all" | "boat" | "blueLagoon" | "beach" | "restaurantCat";

interface GalleryImage {
  src: string;
  category: Category[];
  alt: string;
}

const galleryImages: GalleryImage[] = [
  { src: "/images/boats/tamaris-aerial-swimming.jpg", category: ["boat"], alt: "Tamaris aerial" },
  { src: "/images/boats/tamaris-aerial-cruise.jpg", category: ["boat"], alt: "Tamaris cruise" },
  { src: "/images/boats/tamaris-deck-drinks.jpg", category: ["boat"], alt: "Deck drinks" },
  { src: "/images/boats/tamaris-champagne.jpg", category: ["boat"], alt: "Champagne" },
  { src: "/images/boats/tamaris-bar-night.jpg", category: ["boat"], alt: "Bar night" },
  { src: "/images/boats/tamaris-night-cocktails.jpg", category: ["boat"], alt: "Night cocktails" },
  { src: "/images/boats/tamaris-dinner-deck.jpg", category: ["boat"], alt: "Dinner on deck" },
  { src: "/images/boats/tamaris-group-deck.jpg", category: ["boat"], alt: "Group on deck" },
  { src: "/images/boats/tamaris-sundeck-harbor.jpg", category: ["boat"], alt: "Sundeck harbor" },
  { src: "/images/boats/tamaris-deck-wine.jpg", category: ["boat"], alt: "Deck wine" },
  { src: "/images/tours/blue-lagoon-aerial.jpg", category: ["blueLagoon"], alt: "Blue Lagoon" },
  { src: "/images/tours/beach-hammock.jpg", category: ["beach"], alt: "Beach hammock" },
  { src: "/images/tours/beach-aerial.jpg", category: ["beach", "blueLagoon"], alt: "Beach aerial" },
  { src: "/images/tours/beach-deck-loungers.jpg", category: ["beach"], alt: "Beach loungers" },
  { src: "/images/tours/beach-swings.jpg", category: ["beach"], alt: "Beach swings" },
  { src: "/images/tours/beach-swing-palm.jpg", category: ["beach"], alt: "Swing palm" },
  { src: "/images/tours/pine-restaurant.jpg", category: ["restaurantCat"], alt: "Pine restaurant" },
  { src: "/images/tours/borkko-lounge.jpg", category: ["beach"], alt: "Borkko lounge" },
  { src: "/images/tours/bar-vintage-bicycle.jpg", category: ["restaurantCat"], alt: "Vintage bar" },
  { src: "/images/restaurant/skoy-outdoor-dining.jpg", category: ["restaurantCat"], alt: "Skoy dining" },
  { src: "/images/restaurant/skoy-grilled-fish.jpg", category: ["restaurantCat"], alt: "Grilled fish" },
  { src: "/images/restaurant/skoy-friends-dining.jpg", category: ["restaurantCat"], alt: "Friends dining" },
  { src: "/images/boats/tamaris-group-photo.jpg", category: ["boat"], alt: "Group photo" },
];

const categories: { key: Category; translationKey: string }[] = [
  { key: "all", translationKey: "all" },
  { key: "boat", translationKey: "boat" },
  { key: "blueLagoon", translationKey: "blueLagoon" },
  { key: "beach", translationKey: "beach" },
  { key: "restaurantCat", translationKey: "restaurantCat" },
];

export default function GalleryPage() {
  const t = useTranslations("gallery");
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === "all"
      ? galleryImages
      : galleryImages.filter((img) => img.category.includes(activeCategory));

  return (
    <div className="pt-24 pb-16">
      <div className="container-custom">
        <SectionHeading
          title={t("sectionTitle")}
          subtitle={t("sectionSubtitle")}
        />

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                activeCategory === cat.key
                  ? "bg-[hsl(213,90%,45%)] text-white"
                  : "bg-[hsl(210,20%,96%)] text-[hsl(215,15%,45%)] hover:bg-[hsl(210,20%,93%)]"
              )}
            >
              {t(cat.translationKey)}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((img, i) => (
            <div
              key={img.src}
              onClick={() => setLightboxIndex(i)}
              className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X className="h-8 w-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(
                lightboxIndex > 0 ? lightboxIndex - 1 : filtered.length - 1
              );
            }}
            className="absolute left-4 p-2 text-white/80 hover:text-white"
            aria-label="Previous"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <div
            className="relative w-[90vw] h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={filtered[lightboxIndex].src}
              alt={filtered[lightboxIndex].alt}
              fill
              className="object-contain"
            />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(
                lightboxIndex < filtered.length - 1 ? lightboxIndex + 1 : 0
              );
            }}
            className="absolute right-4 p-2 text-white/80 hover:text-white"
            aria-label="Next"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      )}
    </div>
  );
}
