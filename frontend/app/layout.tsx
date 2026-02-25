import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import Providers from "@/components/Providers";
import { Footer } from '@/components/layout/Footer';
import BallpitBackground from '@/components/background/BallpitBackground';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Biocheck.pro",
  description: "Сканер лабораторных анализов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased min-h-screen flex flex-col relative">
        
        {/* Закидываем шарики на фон */}
        <BallpitBackground />

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