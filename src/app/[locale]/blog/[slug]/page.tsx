"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ArrowRight,
  Anchor,
} from "lucide-react";
import Image from "next/image";
import { getBlogPostBySlug, getRelatedPosts } from "@/lib/blog-data";
import { ScrollReveal } from "@/components/shared/scroll-reveal";

/**
 * Simple markdown-like renderer.
 * Supports: ## headings, ### headings, - list items, **bold**, plain paragraphs.
 * Content is split by double newlines into blocks.
 */
function renderContent(content: string) {
  const blocks = content.split("\n\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let keyIndex = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul
          key={`list-${keyIndex++}`}
          className="list-disc list-inside space-y-1.5 text-[hsl(215,15%,35%)] leading-relaxed mb-6 ml-1"
        >
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Check if the block is a list (lines starting with -)
    const lines = trimmed.split("\n");
    const allList = lines.every((l) => l.trim().startsWith("- "));

    if (allList) {
      // Accumulate list items
      for (const line of lines) {
        listItems.push(line.trim().replace(/^- /, ""));
      }
      continue;
    }

    // Flush any pending list items before non-list content
    flushList();

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${keyIndex++}`}
          className="text-xl font-bold text-[hsl(215,50%,12%)] mt-8 mb-3"
        >
          {trimmed.replace("### ", "")}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${keyIndex++}`}
          className="text-2xl font-bold text-[hsl(215,50%,12%)] mt-10 mb-4"
        >
          {trimmed.replace("## ", "")}
        </h2>
      );
    } else {
      // Check if mixed content (paragraph with some list items inside)
      const mixedLines = trimmed.split("\n");
      const hasMixedList = mixedLines.some((l) => l.trim().startsWith("- "));

      if (hasMixedList) {
        // Render mixed content: paragraphs and inline lists
        let currentParagraph: string[] = [];
        for (const line of mixedLines) {
          if (line.trim().startsWith("- ")) {
            // Flush paragraph
            if (currentParagraph.length > 0) {
              elements.push(
                <p
                  key={`p-${keyIndex++}`}
                  className="text-[hsl(215,15%,35%)] leading-relaxed mb-4"
                >
                  {renderInline(currentParagraph.join(" "))}
                </p>
              );
              currentParagraph = [];
            }
            listItems.push(line.trim().replace(/^- /, ""));
          } else {
            // Flush list items
            if (listItems.length > 0) {
              flushList();
            }
            currentParagraph.push(line.trim());
          }
        }
        // Flush remaining paragraph
        if (currentParagraph.length > 0) {
          elements.push(
            <p
              key={`p-${keyIndex++}`}
              className="text-[hsl(215,15%,35%)] leading-relaxed mb-4"
            >
              {renderInline(currentParagraph.join(" "))}
            </p>
          );
        }
        flushList();
      } else {
        // Plain paragraph
        elements.push(
          <p
            key={`p-${keyIndex++}`}
            className="text-[hsl(215,15%,35%)] leading-relaxed mb-4"
          >
            {renderInline(trimmed)}
          </p>
        );
      }
    }
  }

  // Flush any remaining list items
  flushList();

  return elements;
}

/**
 * Render inline formatting: **bold**
 */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[hsl(215,50%,12%)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function BlogPostPage() {
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;

  const post = getBlogPostBySlug(slug);
  const relatedPosts = getRelatedPosts(slug, 3);

  if (!post) {
    return (
      <div className="pt-24 pb-16">
        <div className="container-custom max-w-3xl text-center">
          <h1 className="text-2xl font-bold text-[hsl(215,50%,12%)] mb-4">
            {locale === "hr" ? "Clanak nije pronadjen" : "Article Not Found"}
          </h1>
          <p className="text-[hsl(215,15%,45%)] mb-6">
            {locale === "hr"
              ? "Trazeni clanak ne postoji."
              : "The requested article does not exist."}
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[hsl(213,90%,45%)] hover:underline font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            {locale === "hr" ? "Natrag na blog" : "Back to Blog"}
          </Link>
        </div>
      </div>
    );
  }

  const title = locale === "hr" ? post.titleHr : post.titleEn;
  const content = locale === "hr" ? post.contentHr : post.contentEn;
  const categoryLabel =
    post.category === "guide"
      ? locale === "hr"
        ? "Vodic"
        : "Guide"
      : post.category === "news"
      ? locale === "hr"
        ? "Novosti"
        : "News"
      : locale === "hr"
      ? "Savjeti"
      : "Tips";

  return (
    <div className="pt-0 pb-16">
      {/* Hero Image */}
      <div className="relative h-[50vh] min-h-[360px] max-h-[500px] w-full">
        <Image
          src={post.image}
          alt={title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        {/* Content overlaid on hero */}
        <div className="absolute inset-0 flex items-end">
          <div className="container-custom pb-10 w-full">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === "hr" ? "Natrag na blog" : "Back to Blog"}
            </Link>
            {/* Category Badge */}
            <div className="mb-3">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                  post.category === "guide"
                    ? "bg-emerald-500/90 text-white"
                    : post.category === "news"
                    ? "bg-blue-500/90 text-white"
                    : "bg-amber-500/90 text-white"
                }`}
              >
                {categoryLabel}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white max-w-3xl leading-tight">
              {title}
            </h1>
            <div className="flex items-center gap-4 mt-4 text-white/70 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(post.date).toLocaleDateString(
                  locale === "hr" ? "hr-HR" : "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readingTimeMin} min {locale === "hr" ? "citanja" : "read"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="container-custom max-w-3xl mt-10">
        <div className="prose-custom">{renderContent(content)}</div>
      </article>

      {/* CTA Section */}
      <div className="container-custom max-w-3xl mt-16">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[hsl(213,90%,40%)] to-[hsl(213,90%,55%)] p-8 sm:p-12 text-center">
          <div className="relative z-10">
            <Anchor className="h-10 w-10 text-white/30 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              {locale === "hr" ? "Spremni za avanturu?" : "Ready for an Adventure?"}
            </h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              {locale === "hr"
                ? "Rezervirajte svoj nezaboravni brodski izlet i dozivite ljepote Jadrana iz prve ruke."
                : "Book your unforgettable boat tour and experience the beauty of the Adriatic firsthand."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/tours/split-tour"
                className="inline-flex items-center justify-center gap-2 bg-white text-[hsl(213,90%,45%)] font-semibold px-6 py-3 rounded-full hover:bg-white/90 transition-colors"
              >
                {locale === "hr" ? "Izlet iz Splita" : "Tour from Split"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/tours/trogir-tour"
                className="inline-flex items-center justify-center gap-2 bg-white/20 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/30 transition-colors border border-white/30"
              >
                {locale === "hr" ? "Izlet iz Trogira" : "Tour from Trogir"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="container-custom mt-16">
          <h2 className="text-2xl font-bold text-[hsl(215,50%,12%)] mb-6 text-center">
            {locale === "hr" ? "Povezani clanci" : "Related Articles"}
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {relatedPosts.map((related, i) => (
              <ScrollReveal key={related.slug} delay={i * 0.1}>
                <Link
                  href={`/blog/${related.slug}`}
                  className="group block bg-white rounded-2xl overflow-hidden border border-[hsl(214,20%,90%)] hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={related.image}
                      alt={
                        locale === "hr" ? related.titleHr : related.titleEn
                      }
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          related.category === "guide"
                            ? "bg-emerald-500/90 text-white"
                            : related.category === "news"
                            ? "bg-blue-500/90 text-white"
                            : "bg-amber-500/90 text-white"
                        }`}
                      >
                        {related.category === "guide"
                          ? locale === "hr"
                            ? "Vodic"
                            : "Guide"
                          : related.category === "news"
                          ? locale === "hr"
                            ? "Novosti"
                            : "News"
                          : locale === "hr"
                          ? "Savjeti"
                          : "Tips"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-[hsl(215,15%,45%)] mb-2">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {related.readingTimeMin} min
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[hsl(215,50%,12%)] line-clamp-2 group-hover:text-[hsl(213,90%,45%)] transition-colors">
                      {locale === "hr" ? related.titleHr : related.titleEn}
                    </h3>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
