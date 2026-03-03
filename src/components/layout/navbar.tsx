"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { LanguageSwitcher } from "./language-switcher";
import { Menu, X, Anchor } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", key: "home" },
  { href: "/tours", key: "tours" },
  { href: "/private-tours", key: "privateTours" },
  { href: "/restaurant", key: "restaurant" },
  { href: "/gallery", key: "gallery" },
  { href: "/pricing", key: "pricing" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isHome = pathname === "/";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled || !isHome || isMobileOpen
          ? "bg-white/95 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="container-custom flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Anchor
            className={cn(
              "h-7 w-7 transition-colors",
              isScrolled || !isHome || isMobileOpen
                ? "text-[hsl(213,90%,45%)]"
                : "text-white"
            )}
          />
          <span
            className={cn(
              "font-bold text-xl tracking-tight transition-colors",
              isScrolled || !isHome || isMobileOpen
                ? "text-[hsl(215,50%,12%)]"
                : "text-white"
            )}
          >
            Max Nautica
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                pathname === link.href
                  ? isScrolled || !isHome
                    ? "text-[hsl(213,90%,45%)] bg-[hsl(213,90%,45%)]/10"
                    : "text-[hsl(45,100%,50%)]"
                  : isScrolled || !isHome
                    ? "text-[hsl(215,15%,45%)] hover:text-[hsl(213,90%,45%)] hover:bg-[hsl(210,20%,96%)]"
                    : "text-white/80 hover:text-white"
              )}
            >
              {t(link.key)}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher
            variant={isScrolled || !isHome ? "dark" : "light"}
          />

          <Link
            href="/tours"
            className="hidden md:inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full bg-[hsl(45,100%,50%)] text-[hsl(215,50%,12%)] hover:bg-[hsl(45,100%,55%)] transition-colors shadow-sm"
          >
            {t("bookNow")}
          </Link>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className={cn(
              "lg:hidden p-2 rounded-lg transition-colors",
              isScrolled || !isHome || isMobileOpen
                ? "text-[hsl(215,50%,12%)] hover:bg-[hsl(210,20%,96%)]"
                : "text-white hover:bg-white/10"
            )}
            aria-label="Menu"
          >
            {isMobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="lg:hidden bg-white border-t border-[hsl(214,20%,90%)]">
          <div className="container-custom py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={cn(
                  "px-4 py-3 rounded-lg text-base font-medium transition-colors",
                  pathname === link.href
                    ? "text-[hsl(213,90%,45%)] bg-[hsl(213,90%,45%)]/10"
                    : "text-[hsl(215,15%,45%)] hover:text-[hsl(213,90%,45%)] hover:bg-[hsl(210,20%,96%)]"
                )}
              >
                {t(link.key)}
              </Link>
            ))}
            <Link
              href="/tours"
              className="mt-2 text-center px-4 py-3 rounded-full bg-[hsl(45,100%,50%)] text-[hsl(215,50%,12%)] font-semibold"
            >
              {t("bookNow")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
