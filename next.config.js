/** @type {import('next').NextConfig} */
const nextConfig = {
  // CRITICAL: StrictMode double-invokes effects in dev, creating duplicate
  // ScrollTrigger instances that fight each other and cause scroll jitter.
  reactStrictMode: false,

  // Static export — site is fully static, no server-side features used.
  // Outputs to out/ for Cloudflare Pages static deployment.
  output: 'export',

  experimental: {
    // Tree-shake GSAP — only bundle plugins actually imported
    optimizePackageImports: ['gsap', '@gsap/react'],
  },

  images: {
    // next/image is only used for static UI assets (logos, etc.)
    // Sequence frames go through canvas drawImage() — bypasses this entirely
    // unoptimized required for static export (no image optimization server)
    unoptimized: true,
  },
}

module.exports = nextConfig
