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
  // 1. Правильное извлечение локали через await
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  const title = t('title', { fallback: 'webdoc.life' });
  const description = t('description', { fallback: 'AI Blood Test Interpreter' });

  return {
    // 2. Базовый URL для всех мета-ссылок
    metadataBase: new URL('https://webdoc.life'), 
    title,
    description,
    
    // 3. Красивые превью для Telegram, LinkedIn и др.
    openGraph: {
      title,
      description,
      url: `/${locale}`,
      siteName: 'webdoc.life',
      locale: locale,
      type: 'website',
      // Картинка подхватится автоматически, если добавить metadataBase
      images: [
        {
          url: '/opengraph-image.png', 
          width: 1200,
          height: 630,
        },
      ],
    },

    // 4. Защита от дублей контента (SEO)
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

        {/* Интеграция Google Analytics (отключается, если NEXT_PUBLIC_GA_ID не задан) */}
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  );
}