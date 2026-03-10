import type { Metadata } from "next";
import { Arimo, Montserrat } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import Providers from "@/components/Providers";
import { Footer } from '@/components/layout/Footer';

// Шрифт для крупных заголовков (поменяли на Arimo)
const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["cyrillic", "latin"],
});

// Шрифт для всего остального (мелкий текст)
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["cyrillic", "latin"],
});

export const metadata: Metadata = {
  title: "DataDoctor.pro",
  description: "Ваш дешифратор анализов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      {/* Прокидываем новые переменные шрифтов */}
      <body className={`${arimo.variable} ${montserrat.variable} font-sans antialiased min-h-screen flex flex-col relative`}>
        
        {/* Закидываем шарики на фон */}

        <Providers>
          {/* Оборачиваем контент и поднимаем его по z-index */}
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header />
            
            <main className="flex-1">
              {children}
            </main>
            
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}