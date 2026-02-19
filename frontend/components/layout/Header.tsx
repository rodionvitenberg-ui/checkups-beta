"use client";

import Link from "next/link";
import Image from "next/image"; // Импортируем Image
import { User, LogIn } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuth(!!token);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ЛЕВАЯ ЧАСТЬ: Логотип */}
        <div className="flex items-center">
          <Link 
            href="/" 
            className="hover:opacity-80 transition-opacity flex items-center"
          >
            {/* Заменили текст и иконку на картинку */}
            <Image 
                src="/logo.png" 
                alt="Checkups Logo" 
                width={140} // Подбери ширину под свой логотип
                height={40} 
                className="h-15 w-auto object-contain" // h-10 фиксирует высоту, ширина авто
                priority // Важно для LCP (чтобы не прыгало при загрузке)
            />
          </Link>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: Умная кнопка */}
        <div className="flex items-center gap-4">
          <Link
            href={isAuth ? "/dashboard" : "/auth"}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
          >
            {isAuth ? <User className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            <span className="hidden sm:inline">
                {isAuth ? "Кабинет" : "Войти"}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}