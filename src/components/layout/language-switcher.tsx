"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "light" | "dark";
}

export function LanguageSwitcher({ variant = "dark" }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: "hr" | "en") => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div
      className={cn(
        "flex items-center rounded-full p-0.5 text-sm font-medium",
        variant === "dark"
          ? "bg-[hsl(210,20%,96%)]"
          : "bg-white/15 backdrop-blur-sm"
      )}
    >
      <button
        onClick={() => switchLocale("hr")}
        className={cn(
          "px-2.5 py-1 rounded-full transition-all",
          locale === "hr"
            ? variant === "dark"
              ? "bg-[hsl(213,90%,45%)] text-white shadow-sm"
              : "bg-white text-[hsl(215,50%,12%)] shadow-sm"
            : variant === "dark"
              ? "text-[hsl(215,15%,45%)] hover:text-[hsl(215,50%,12%)]"
              : "text-white/70 hover:text-white"
        )}
      >
        HR
      </button>
      <button
        onClick={() => switchLocale("en")}
        className={cn(
          "px-2.5 py-1 rounded-full transition-all",
          locale === "en"
            ? variant === "dark"
              ? "bg-[hsl(213,90%,45%)] text-white shadow-sm"
              : "bg-white text-[hsl(215,50%,12%)] shadow-sm"
            : variant === "dark"
              ? "text-[hsl(215,15%,45%)] hover:text-[hsl(215,50%,12%)]"
              : "text-white/70 hover:text-white"
        )}
      >
        EN
      </button>
    </div>
  );
}
