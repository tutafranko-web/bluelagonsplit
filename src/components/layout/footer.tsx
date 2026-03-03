"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Anchor, Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";
import { PHONE_DISPLAY, PHONE_NUMBER, SOCIAL_LINKS } from "@/lib/constants";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  return (
    <footer className="bg-[hsl(215,60%,12%)] text-white">
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Anchor className="h-6 w-6 text-[hsl(45,100%,50%)]" />
              <span className="font-bold text-xl">{t("company")}</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              {t("tagline")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-[hsl(45,100%,50%)] mb-4">
              {t("quickLinks")}
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/tours", label: nav("tours") },
                { href: "/private-tours", label: nav("privateTours") },
                { href: "/restaurant", label: nav("restaurant") },
                { href: "/gallery", label: nav("gallery") },
                { href: "/pricing", label: nav("pricing") },
                { href: "/about", label: nav("about") },
                { href: "/contact", label: nav("contact") },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-[hsl(45,100%,50%)] mb-4">
              {t("contactInfo")}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-white/60">
                <Phone className="h-4 w-4 text-[hsl(45,100%,50%)]" />
                <a
                  href={`tel:${PHONE_NUMBER}`}
                  className="hover:text-white transition-colors"
                >
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/60">
                <Mail className="h-4 w-4 text-[hsl(45,100%,50%)]" />
                <a
                  href="mailto:info@maxnautica.hr"
                  className="hover:text-white transition-colors"
                >
                  info@maxnautica.hr
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/60">
                <MapPin className="h-4 w-4 text-[hsl(45,100%,50%)] mt-0.5" />
                <span>Split & Trogir, Hrvatska</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold text-[hsl(45,100%,50%)] mb-4">
              {t("followUs")}
            </h3>
            <div className="flex gap-3">
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-white/40">
          &copy; {new Date().getFullYear()} Max Nautica. {t("rights")}
        </div>
      </div>
    </footer>
  );
}
