'use client'

// NoiseOverlay.jsx — Fixed full-screen film grain texture.
// Pure CSS animation — no JS after mount. The SVG turbulence filter generates
// true noise without any external image requests.
// mix-blend-mode: overlay preserves image contrast while adding texture.

export default function NoiseOverlay() {
  return (
    <div
      className="noise-overlay"
      aria-hidden="true"
      role="presentation"
    />
  )
}
