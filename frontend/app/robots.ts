import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://webdoc.life';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/legal', '/terms', '/cookies', '/disclaimer', '/faq'],
      disallow: ['/dashboard/', '/api/', '/analysis/'], // Закрываем приватные зоны
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}