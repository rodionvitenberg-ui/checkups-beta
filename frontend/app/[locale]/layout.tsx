import type { Metadata } from "next";
import { Arimo, Montserrat } from "next/font/google";
import "../globals.css"; 
import { Header } from "@/components/layout/Header";
import Providers from "@/components/Providers";
import { Footer } from '@/components/layout/Footer';
import ConsentBanner from "@/components/layout/ConsentBanner";
import PaywallModal from "@/components/layout/PaywallModal";

// Импорты для next-intl
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

// Импорт для аналитики
import { GoogleAnalytics } from '@next/third-parties/google';

const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["cyrillic", "latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["cyrillic", "latin"],
});

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; 
}

// Динамические метаданные
export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    metadataBase: new URL('https://webdoc.life'), // Важно для корректного SEO и путей OpenGraph
    title: t('title', { fallback: 'DataDoctor.pro' }),
    description: t('description', { fallback: 'AI Blood Test Interpreter' }),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'ru-RU': '/ru',
        'en-US': '/en',
        'es-ES': '/es',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: Props) {
  
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${arimo.variable} ${montserrat.variable} font-sans antialiased min-h-screen flex flex-col relative`}>
        
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="relative z-10 flex flex-col min-h-screen">
              <Header />
              <ConsentBanner />
              <main className="flex-1">
                {children}
              </main>
              
              <Footer />
              <PaywallModal />
            </div>
          </Providers>
        </NextIntlClientProvider>

        {/* Интеграция Google Analytics */}
        <GoogleAnalytics gaId="G-XXXXXXXXXX" /> 
      </body>
    </html>
  );
}