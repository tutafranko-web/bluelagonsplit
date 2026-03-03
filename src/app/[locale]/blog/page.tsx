"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SectionHeading } from "@/components/shared/section-heading";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { Calendar, ArrowRight, Clock, BookOpen, Newspaper, Lightbulb } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { blogPosts } from "@/lib/blog-data";

type CategoryFilter = "all" | "guide" | "news" | "tips";

const categoryConfig: Record<
  CategoryFilter,
  { labelHr: string; labelEn: string; icon: typeof BookOpen }
> = {
  all: { labelHr: "Sve", labelEn: "All", icon: BookOpen },
  guide: { labelHr: "Vodici", labelEn: "Guides", icon: BookOpen },
  news: { labelHr: "Novosti", labelEn: "News", icon: Newspaper },
  tips: { labelHr: "Savjeti", labelEn: "Tips", icon: Lightbulb },
};

export default function BlogPage() {
  const t = useTranslations("blog");
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  const filteredPosts =
    activeCategory === "all"
      ? blogPosts
      : blogPosts.filter((post) => post.category === activeCategory);

  // Sort by date descending
  const sortedPosts = [...filteredPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="pt-24 pb-16">
      <div className="container-custom">
        <SectionHeading
          title={t("sectionTitle")}
          subtitle={t("sectionSubtitle")}
        />

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mt-8 mb-8">
          {(Object.keys(categoryConfig) as CategoryFilter[]).map((cat) => {
            const config = categoryConfig[cat];
            const Icon = config.icon;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[hsl(213,90%,45%)] text-white shadow-md"
                    : "bg-white text-[hsl(215,15%,45%)] border border-[hsl(214,20%,90%)] hover:border-[hsl(213,90%,45%)] hover:text-[hsl(213,90%,45%)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {locale === "hr" ? config.labelHr : config.labelEn}
              </button>
            );
          })}
        </div>

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPosts.map((post, i) => (
            <ScrollReveal key={post.slug} delay={i * 0.1}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block bg-white rounded-2xl overflow-hidden border border-[hsl(214,20%,90%)] hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={post.image}
                    alt={locale === "hr" ? post.titleHr : post.titleEn}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        post.category === "guide"
                          ? "bg-emerald-500/90 text-white"
                          : post.category === "news"
                          ? "bg-blue-500/90 text-white"
                          : "bg-amber-500/90 text-white"
                      }`}
                    >
                      {locale === "hr"
                        ? categoryConfig[post.category].labelHr
                        : categoryConfig[post.category].labelEn}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 text-xs text-[hsl(215,15%,45%)] mb-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(post.date).toLocaleDateString(
                        locale === "hr" ? "hr-HR" : "en-US",
                        { year: "numeric", month: "long", day: "numeric" }
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readingTimeMin} min {locale === "hr" ? "citanja" : "read"}
                    </span>
                  </div>
                  <h3 className="font-bold text-[hsl(215,50%,12%)] mb-2 line-clamp-2 group-hover:text-[hsl(213,90%,45%)] transition-colors">
                    {locale === "hr" ? post.titleHr : post.titleEn}
                  </h3>
                  <p className="text-sm text-[hsl(215,15%,45%)] line-clamp-3 mb-3">
                    {locale === "hr" ? post.excerptHr : post.excerptEn}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(213,90%,45%)]">
                    {t("readMore")}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        {/* Empty state */}
        {sortedPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[hsl(215,15%,45%)] text-lg">
              {locale === "hr"
                ? "Nema clanaka u ovoj kategoriji."
                : "No articles in this category."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
