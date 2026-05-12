'use client'

// LoadingScreen.jsx — Fixed overlay shown until hero section frames are ready.
// CSS transition handles the hide — no GSAP needed here since it only fires once.

export default function LoadingScreen({ isVisible, progress = 0 }) {
  return (
    <div className={`loading-screen${isVisible ? '' : ' hidden'}`} aria-live="polite">
      <span className="loading-label">Loading Experience</span>
      <div className="loading-bar-track" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="loading-bar-fill"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  )
}
