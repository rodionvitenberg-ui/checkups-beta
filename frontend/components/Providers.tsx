'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Инициализируем QueryClient один раз на сессию пользователя
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // Данные считаются свежими 1 минуту 
        refetchOnWindowFocus: false, // Не дергать бэкенд, когда юзер просто переключает вкладки браузера
        retry: 1, // Если запрос упал, попробовать еще 1 раз перед выдачей ошибки
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}