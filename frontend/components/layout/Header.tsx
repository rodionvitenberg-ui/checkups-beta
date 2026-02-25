"use client";

import Link from "next/link";
import Image from "next/image"; 
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MorphyButton } from "@/components/ui/morphy-button";

export function Header() {
  const [isAuth, setIsAuth] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Добавляем флаг монтирования компонента на клиенте
  const [isMounted, setIsMounted] = useState(false); 
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuth(!!token);
    };

    checkAuth();
    setIsMounted(true); // Указываем, что клиент отрендерился и localStorage прочитан

    window.addEventListener('auth-change', checkAuth);
    return () => window.removeEventListener('auth-change', checkAuth);
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
        setIsMobileMenuOpen(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigation = (path: string) => {
    setIsMobileMenuOpen(false);
    router.push(path);
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-200 bg-background backdrop-blur-md transition-transform duration-300 ease-in-out transform-gpu antialiased [backface-visibility:hidden]",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 relative bg-transparent z-10">
        <div className="flex items-center">
          <Link 
            href="/" 
            className="hover:opacity-80 transition-opacity flex items-center"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Image 
                src="/logo.png" 
                alt="Checkups Logo" 
                width={140} 
                height={40} 
                className="h-15 w-auto object-contain" 
                priority 
                unoptimized 
            />
          </Link>
        </div>

        {/* Десктопная версия */}
        <div className="hidden md:flex items-center gap-3 sm:gap-5">
          <MorphyButton 
            size="default" 
            onClick={() => handleNavigation('/faq')}
          >
            FAQ
          </MorphyButton>

          <MorphyButton 
            size="default" 
            className="w-[130px] flex justify-center"
            onClick={() => handleNavigation(isAuth ? "/dashboard" : "/auth")}
            disabled={!isMounted} 
          >
            {!isMounted ? (
              <span className="opacity-0">Кабинет</span> 
            ) : isAuth ? (
              "Кабинет"
            ) : (
              "Войти"
            )}
          </MorphyButton>
        </div>

        {/* Мобильная кнопка-бургер */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative flex h-10 w-10 items-center justify-center transition-colors focus:outline-none"
            aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            <div className="relative flex h-[14px] w-[22px] flex-col items-center justify-between overflow-visible">
              {/* Верхняя линия */}
              <span
                className={cn(
                  "absolute left-0 h-[2px] w-full transform rounded-full bg-secondary transition-all duration-300 ease-in-out",
                  isMobileMenuOpen ? "top-[6px] rotate-45" : "top-0"
                )}
              />
              {/* Средняя линия */}
              <span
                className={cn(
                  "absolute left-0 top-[6px] h-[2px] w-full transform rounded-full bg-secondary transition-all duration-300 ease-in-out",
                  isMobileMenuOpen ? "translate-x-3 opacity-0" : "translate-x-0 opacity-100"
                )}
              />
              {/* Нижняя линия */}
              <span
                className={cn(
                  "absolute left-0 h-[2px] w-full transform rounded-full bg-secondary transition-all duration-300 ease-in-out",
                  isMobileMenuOpen ? "top-[6px] -rotate-45" : "bottom-0"
                )}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Выдвижное мобильное меню */}
      <div 
        className={cn(
          "absolute top-16 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg md:hidden transition-all duration-300 origin-top overflow-hidden",
          isMobileMenuOpen ? "scale-y-100 opacity-100 h-auto py-4" : "scale-y-0 opacity-0 h-0 py-0"
        )}
      >
        <div className="flex flex-col gap-3 px-4">
          <MorphyButton 
            size="default" 
            className="w-full"
            onClick={() => handleNavigation('/faq')}
          >
            FAQ
          </MorphyButton>

          <MorphyButton 
            size="default" 
            className="w-full"
            onClick={() => handleNavigation(isAuth ? "/dashboard" : "/auth")}
            disabled={!isMounted}
          >
             {!isMounted ? <span className="opacity-0">Кабинет</span> : (isAuth ? "Кабинет" : "Войти")}
          </MorphyButton>
        </div>
      </div>
    </header>
  );
}