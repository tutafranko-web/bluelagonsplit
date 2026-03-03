import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { OrganizationJsonLd } from "@/components/shared/json-ld";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Max Nautica | Brodski izleti Split & Trogir",
    template: "%s | Max Nautica",
  },
  description:
    "Nezaboravni jednodnevni izleti brodom iz Splita i Trogira do Plave lagune, Šolte i skrivenih uvala Jadrana. 10+ godina iskustva, 3 premium broda.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://maxnautica.hr"
  ),
  openGraph: {
    type: "website",
    locale: "hr_HR",
    alternateLocale: "en_US",
    siteName: "Max Nautica",
    images: [
      {
        url: "/images/boats/tamaris-aerial-swimming.jpg",
        width: 1200,
        height: 630,
        alt: "Max Nautica - Boat Tours Split & Trogir",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "/",
    languages: {
      hr: "/hr",
      en: "/en",
    },
  },
  keywords: [
    "boat tour split",
    "boat tour trogir",
    "blue lagoon croatia",
    "brodski izlet split",
    "plava laguna",
    "max nautica",
    "island hopping split",
    "day trip split",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr" suppressHydrationWarning>
      <head>
        <OrganizationJsonLd />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
