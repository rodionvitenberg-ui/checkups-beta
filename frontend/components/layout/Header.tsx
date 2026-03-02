"use client";

import Link from "next/link";
import Image from "next/image"; 
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MorphyButton } from "@/components/ui/morphy-button"; // Возвращаем импорт MorphyButton

// --- Вспомогательный компонент только для десктопных кнопок ---
interface NavButtonProps {
  text: string;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ text, isActive, onClick }: NavButtonProps) {
  return (
    <button 
      onClick={onClick} 
      className="relative flex items-center justify-center group focus:outline-none transform-gpu"
    >
      <Image 
        src="/buttons/smallbutton.png" 
        alt={`Фон кнопки ${text}`} 
        width={130} 
        height={40} 
        className={cn(
          "w-auto h-10 drop-shadow object-contain transition-opacity duration-300 ease-in-out will-change-filter",
          "filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]",
          // На десктопе фон скрыт (opacity-0), если страница не активна, 
          // и появляется при наведении (group-hover:opacity-100).
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )} 
      />
      {/* Текст всегда остается 100% видимым */}
      <span className="absolute z-10 font-bold text-medium">
        {text}
      </span>
    </button>
  );
}
// --------------------------------------------------------

export function Header() {
  const [isAuth, setIsAuth] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isMounted, setIsMounted] = useState(false); 
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuth(!!token);
    };

    checkAuth();
    setIsMounted(true);

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

  const authPath = isAuth ? "/dashboard" : "/auth";

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-md transition-transform duration-300 ease-in-out transform-gpu antialiased [backface-visibility:hidden]",
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
                width={100} 
                height={40} 
                className="h-12 w-auto object-contain" 
                priority 
                unoptimized 
            />
          </Link>
        </div>

        {/* Десктопная версия (кастомные кнопки-картинки) */}
        <div className="hidden md:flex items-center gap-3 sm:gap-5">
          <NavButton 
            text="Главная" 
            isActive={pathname === '/'} 
            onClick={() => handleNavigation('/')} 
          />

          <div className={cn("transition-opacity duration-300", !isMounted ? "opacity-0" : "opacity-100")}>
            <NavButton 
              text={isAuth ? "Кабинет" : "Войти"} 
              isActive={pathname === authPath} 
              onClick={() => handleNavigation(authPath)} 
            />
          </div>
        </div>

        {/* Мобильная кнопка-бургер */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative flex h-10 w-10 items-center justify-center transition-colors focus:outline-none"
            aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            <div className="relative flex h-[14px] w-[22px] flex-col items-center justify-between overflow-visible">
              <span className={cn("absolute left-0 h-[2px] w-full transform rounded-full bg-secondary transition-all duration-300 ease-in-out", isMobileMenuOpen ? "top-[6px] rotate-45" : "top-0")} />
              <span className={cn("absolute left-0 top-[6px] h-[2px] w-full transform rounded-full bg-secondary transition-all duration-300 ease-in-out", isMobileMenuOpen ? "translate-x-3 opacity-0" : "translate-x-0 opacity-100")} />
              <span className={cn("absolute left-0 h-[2px] w-full transform rounded-full bg-secondary transition-all duration-300 ease-in-out", isMobileMenuOpen ? "top-[6px] -rotate-45" : "bottom-0")} />
            </div>
          </button>
        </div>
      </div>

      {/* Выдвижное мобильное меню */}
      <div 
        className={cn(
          "absolute top-16 left-0 right-0 w-full md:hidden transition-all duration-300 origin-top overflow-hidden",
          // Убрали белый фон, добавили прозрачность (bg-transparent) и блюр (backdrop-blur-md)
          "bg-border backdrop-blur-md",
          isMobileMenuOpen ? "scale-y-100 opacity-100 h-auto py-4" : "scale-y-0 opacity-0 h-0 py-0"
        )}
      >
        <div className="flex flex-col gap-3 px-4">
          <MorphyButton 
            size="default" 
            className="w-full"
            onClick={() => handleNavigation('/')}
          >
            Главная
          </MorphyButton>

          <MorphyButton 
            size="default" 
            className="w-full"
            onClick={() => handleNavigation(authPath)}
            disabled={!isMounted}
          >
             {!isMounted ? <span className="opacity-0">Кабинет</span> : (isAuth ? "Кабинет" : "Войти")}
          </MorphyButton>
        </div>
      </div>
    </header>
  );
}