import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
// Force cache invalidation - ghost directory cleanup
const nextConfig = {
  // TypeScript build errors are currently ignored to allow rapid development
  // Enable strict type checking once the codebase matures and types are properly defined
  typescript: {
    ignoreBuildErrors: true,
  },
  // Empty turbopack config to silence build error when using webpack
  turbopack: {},
  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  
  // Performance optimizations
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["googleapis", "nodemailer", "bcryptjs", "@sparticuz/chromium", "puppeteer-core"],
  
  // Next.js 16: React Compiler for automatic memoization
  reactCompiler: true,
  
  // Next.js 16: Experimental features
  experimental: {
    serverMinification: true,
    // Optimize package imports for faster builds and smaller bundles
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-icons',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-accordion',
      '@tiptap/core',
      '@tiptap/react',
      '@tiptap/starter-kit',
      'date-fns',
      'recharts',
      '@supabase/supabase-js',
      '@supabase/ssr',
      'swr',
      'sonner',
      'react-hook-form',
      'zod',
      'xlsx',
      'docx',
      'dequal',
    ],
  },
  
  // Webpack: extend (not override) Next.js defaults for large libraries
  webpack: (config, { isServer }) => {
    if (!isServer && config.optimization?.splitChunks?.cacheGroups) {
      // Add custom cache groups without disabling Next.js defaults
      Object.assign(config.optimization.splitChunks.cacheGroups, {
        recharts: {
          name: 'recharts',
          test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
          priority: 30,
          reuseExistingChunk: true,
          enforce: true,
        },
        tiptap: {
          name: 'tiptap',
          test: /[\\/]node_modules[\\/](@tiptap|prosemirror-.*)[\\/]/,
          priority: 30,
          reuseExistingChunk: true,
          enforce: true,
        },
      })
    }
    return config
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
