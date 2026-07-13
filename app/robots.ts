import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/config'

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/partner', '/api/', '/account', '/checkout', '/wallet', '/messages'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
