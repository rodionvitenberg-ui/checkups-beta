import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

// Обязательно export const!
export const routing = defineRouting({
  locales: ['en', 'es', 'ru'],
  defaultLocale: 'en'
});

export const {Link, redirect, usePathname, useRouter, getPathname} = createNavigation(routing);