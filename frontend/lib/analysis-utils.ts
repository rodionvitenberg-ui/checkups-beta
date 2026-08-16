import { format } from 'date-fns';
import { ru, enUS, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';

// Единый парсинг даты анализа: сначала дата от ИИ (extracted_date), затем fallback на created_at.
// Поддерживает ISO-даты и русский формат "DD.MM.YYYY".
export function parseAnalysisDate(extractedDate: string | undefined, createdAt: string | undefined): Date {
  let d = createdAt ? new Date(createdAt) : new Date();

  if (extractedDate) {
    const parsed = new Date(extractedDate);
    if (!isNaN(parsed.getTime())) {
      d = parsed;
    } else if (extractedDate.includes('.')) {
      const parts = extractedDate.split('.');
      if (parts.length >= 3) {
        const parsed2 = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(parsed2.getTime())) d = parsed2;
      }
    }
  }

  return d;
}

// Дата с учётом локали приложения
export function formatAnalysisDate(
  extractedDate: string | undefined,
  createdAt: string | undefined,
  locale: string,
  pattern = 'd MMMM yyyy',
): string {
  const dateLocaleMap: Record<string, Locale> = { ru, es, en: enUS };
  const dateLocale = dateLocaleMap[locale] || enUS;
  return format(parseAnalysisDate(extractedDate, createdAt), pattern, { locale: dateLocale });
}

// Скачивание сгенерированного PDF-блобa
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}