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
  // Empty turbopack config to silence build error when using webpack
  turbopack: {},
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
  
  // Next.js 16: React Compiler (moved from experimental in v16)
  reactCompiler: false, // Enable when ready for React Compiler
  
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
      '@supabase/supabase-js',
      '@supabase/ssr',
      'swr',
      'sonner',
      'react-hook-form',
      'zod',
    ],
  },
  
  // Webpack optimizations for bundle size
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensure proper code splitting for large libraries
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Supabase client - load on demand only
            supabase: {
              name: 'supabase',
              test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
            // SWR - load on demand only
            swr: {
              name: 'swr',
              test: /[\\/]node_modules[\\/](swr)[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
            // Charts library - load on demand
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
            // Common React libraries
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // UI components that are used everywhere
            ui: {
              name: 'ui',
              test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
              priority: 15,
              reuseExistingChunk: true,
            },
            // Other vendor libraries
            lib: {
              name: 'lib',
              test: /[\\/]node_modules[\\/]/,
              priority: 5,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
        },
      }
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
