"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { blogPosts } from "@/lib/blog-data";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { Clock, ArrowRight } from "lucide-react";
import Image from "next/image";

const categoryColors: Record<string, string> = {
  guide: "bg-emerald-500/90",
  news: "bg-blue-500/90",
  tips: "bg-amber-500/90",
};

export function BlogPreview() {
  const t = useTranslations("blog");
  const locale = useLocale();

  const latestPosts = [...blogPosts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <ScrollReveal>
          <SectionHeading
            title={t("sectionTitle")}
            subtitle={t("sectionSubtitle")}
          />
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestPosts.map((post, i) => (
            <ScrollReveal key={post.slug} delay={i * 0.15}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block bg-white rounded-2xl overflow-hidden border border-[hsl(214,20%,90%)] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={post.image}
                    alt={locale === "hr" ? post.titleHr : post.titleEn}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span
                    className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white ${categoryColors[post.category]}`}
                  >
                    {post.category === "guide"
                      ? locale === "hr" ? "Vodič" : "Guide"
                      : post.category === "news"
                      ? locale === "hr" ? "Vijesti" : "News"
                      : locale === "hr" ? "Savjeti" : "Tips"}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 text-xs text-[hsl(215,15%,45%)] mb-2">
                    <time>
                      {new Date(post.date).toLocaleDateString(
                        locale === "hr" ? "hr-HR" : "en-US",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </time>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readingTimeMin} min
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[hsl(215,50%,12%)] mb-2 group-hover:text-[hsl(213,90%,45%)] transition-colors line-clamp-2">
                    {locale === "hr" ? post.titleHr : post.titleEn}
                  </h3>
                  <p className="text-sm text-[hsl(215,15%,45%)] line-clamp-2">
                    {locale === "hr" ? post.excerptHr : post.excerptEn}
                  </p>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="mt-10 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-[hsl(213,90%,45%)] font-semibold hover:underline"
            >
              {t("viewAll")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
