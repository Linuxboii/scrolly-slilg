/** @type {import('next').NextConfig} */
const nextConfig = {
  // CRITICAL: StrictMode double-invokes effects in dev, creating duplicate
  // ScrollTrigger instances that fight each other and cause scroll jitter.
  reactStrictMode: false,

  experimental: {
    // Tree-shake GSAP — only bundle plugins actually imported
    optimizePackageImports: ['gsap', '@gsap/react'],
  },

  images: {
    // next/image is only used for static UI assets (logos, etc.)
    // Sequence frames go through canvas drawImage() — bypasses this entirely
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 1080, 1920],
  },
}

module.exports = nextConfig
