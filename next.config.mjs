/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // لا نُخفي أخطاء الأنواع — يجب أن يمرّ البناء نظيفاً.
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Keep pg and its Node.js dependencies (net, tls, dns, fs) out of the browser bundle
  serverExternalPackages: ['pg', 'pg-connection-string', 'pgpass'],
}

export default nextConfig
