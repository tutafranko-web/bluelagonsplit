import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/chat/chat-widget";
import { AmbientAudioProvider } from "@/components/shared/ambient-audio";
import { ScrollToTop } from "@/components/shared/scroll-to-top";

function SetHtmlLang({ locale }: { locale: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang="${locale}";`,
      }}
    />
  );
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "hr" | "en")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <SetHtmlLang locale={locale} />
      <AmbientAudioProvider>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <ChatWidget />
        <ScrollToTop />
      </AmbientAudioProvider>
    </NextIntlClientProvider>
  );
}
