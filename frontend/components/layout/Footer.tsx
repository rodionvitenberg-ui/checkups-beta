import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full backdrop-blur-md mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
          
          {/* Левая часть: Логотип и копирайт */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image 
                src="/logo.png" 
                alt="Checkups Logo" 
                width={140} 
                height={40} 
                className="h-10 w-auto object-contain" 
                unoptimized // ДОБАВЛЕНО: отключаем сжатие для максимальной четкости
              />
            </Link>
            <p className="text-sm text-slate-400">
              © {currentYear} DataDoctor. Все права защищены.
            </p>
          </div>

          {/* Правая часть: Ссылки */}
          <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm font-bold text-slate-500 tracking-wide">
            {/* Я поставил ссылку на главную страницу, но ты можешь заменить на нужную */}
            <Link href="/" className="hover:text-blue-600 transition-colors uppercase">
              О проекте
            </Link>
            
            {/* Ссылку /legal нужно будет потом создать, или указать свой путь */}
            <Link href="/legal" className="hover:text-blue-600 transition-colors uppercase">
              Юридическая информация
            </Link>
          </div>

        </div>
      </div>
    </footer>
  );
}