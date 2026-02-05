import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: Re-enable type checking once all `any` types are fixed
  // typescript: {
  //   ignoreBuildErrors: false,
  // },
  typescript: {
    ignoreBuildErrors: true, // TODO: Fix remaining type errors and set to false
  },
  // Fix Turbopack workspace root detection
  turbopack: {
    root: process.cwd(),
  },
  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Performance optimizations
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["googleapis", "nodemailer", "bcryptjs"],
  
  // Next.js 16: Experimental features
  experimental: {
    serverMinification: true,
    // Optimize package imports for faster builds and smaller bundles
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'date-fns',
      'recharts',
    ],
    reactCompiler: false, // Enable when ready for React Compiler
  },
  async headers() {
    return [
      // Static assets - aggressive caching
      {
        source: "/:all*(svg|jpg|jpeg|png|gif|webp|avif|ico|woff|woff2|ttf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // API routes - no cache for mutations, short cache for reads
      {
        source: "/api/:path*",
        headers: [
          { 
            key: "Cache-Control", 
            value: "no-store, no-cache, must-revalidate" 
          },
        ],
      },
      // Global security headers
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
