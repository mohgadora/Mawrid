/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // لا نُخفي أخطاء الأنواع — يجب أن يمرّ البناء نظيفاً.
    ignoreBuildErrors: false,
  },
  images: {
    // Allow any hostname for uploaded/external images.
    // In production, restrict to your CDN domain instead.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
  },
  // Keep pg and its Node.js dependencies (net, tls, dns, fs) out of the browser bundle
  serverExternalPackages: ['pg', 'pg-connection-string', 'pgpass'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',            value: 'DENY' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=(self)' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",   // Next.js requires unsafe-eval in dev
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      // CORS for /api/v1 — restrict to known origins via env; default to same-origin
      {
        source: '/api/v1/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.CORS_ORIGIN ?? 'same-origin',
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ]
  },
}

export default nextConfig
