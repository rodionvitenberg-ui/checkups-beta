import type { Metadata } from "next";
import { Arimo, Montserrat } from "next/font/google";
import "../globals.css"; 
import { Header } from "@/components/layout/Header";
import Providers from "@/components/Providers";
import { Footer } from '@/components/layout/Footer';

// Импорты для next-intl
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["cyrillic", "latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["cyrillic", "latin"],
});

// ШАГ 1: Указываем, что params - это Promise
interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; 
}

// Динамические метаданные в зависимости от языка
export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  // ШАГ 2: "Распаковываем" промис через await
  const { locale } = await params;
  
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: t('title', { fallback: 'DataDoctor.pro' }),
    description: t('description', { fallback: 'AI Blood Test Interpreter' }),
  };
}

export default async function LocaleLayout({
  children,
  params
}: Props) {
  
  // ШАГ 3: Аналогично распаковываем промис здесь
  const { locale } = await params;

  // Проверяем, валидна ли локаль. Если нет - 404
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Получаем JSON словари на сервере
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${arimo.variable} ${montserrat.variable} font-sans antialiased min-h-screen flex flex-col relative`}>
        
        {/* Оборачиваем всё в провайдер локализации */}
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="relative z-10 flex flex-col min-h-screen">
              <Header />
              
              <main className="flex-1">
                {children}
              </main>
              
              <Footer />
            </div>
          </Providers>
        </NextIntlClientProvider>

      </body>
    </html>
  );
}