/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
  serverComponentsExternalPackages: ['razorpay'],
},

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle Node.js modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
