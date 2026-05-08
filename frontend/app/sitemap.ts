import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://webdoc.life';
  const locales = ['ru', 'en', 'es'];
  const staticPages = ['', '/faq', '/legal', '/terms', '/cookies', '/disclaimer'];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  staticPages.forEach((route) => {
    locales.forEach((locale) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1.0 : 0.8,
      });
    });
  });

  return sitemapEntries;
}