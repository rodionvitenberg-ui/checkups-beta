"use client";

import Link from "next/link";
import { User } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ЛЕВАЯ ЧАСТЬ: Логотип */}
        <div className="flex items-center">
          <Link 
            href="/" 
            className="text-xl font-bold tracking-tight text-gray-900 hover:opacity-80 transition-opacity"
          >
            Checkups
          </Link>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: Личный кабинет */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard" // Пока ведем на /dashboard, позже настроим логику
            className="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Кабинет</span>
          </Link>
        </div>
      </div>
    </header>
  );
}