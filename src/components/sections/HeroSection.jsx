'use client'

// HeroSection.jsx — Building facade reveal.
// Canvas drives the frame sequence. Text overlays are separate DOM elements
// so GSAP can animate them independently (y + opacity) without touching the canvas.
// The fog overlay adds cinematic depth without obscuring the architecture.

import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react'
import useImageSequence from '@/hooks/useImageSequence'
import { SECTIONS } from '@/config/sections'

const config = SECTIONS[0]

const HeroSection = forwardRef(function HeroSection({ onSetFrame }, ref) {
  const sectionRef = useRef(null)
  const eyebrowRef = useRef(null)
  const headlineRef = useRef(null)
  const fogRef = useRef(null)

  const { canvasRef, setFrame, loadProgress } = useImageSequence({
    basePath: config.basePath,
    totalFrames: config.frameCount,
  })

  // Expose DOM refs to scroll orchestrator via the forwarded ref
  // The orchestrator uses these to wire up text animation timelines
  useImperativeHandle(ref, () => ({
    el: sectionRef.current,
    eyebrowEl: eyebrowRef.current,
    headlineEl: headlineRef.current,
    fogEl: fogRef.current,
    setFrame,
  }))

  // Register setFrame with parent page.jsx
  useEffect(() => {
    if (onSetFrame) onSetFrame(setFrame)
  }, [onSetFrame, setFrame])

  // Sync imperative handle after mount (refs are null on first render)
  useEffect(() => {
    if (ref && 'current' in ref) {
      ref.current = {
        el: sectionRef.current,
        eyebrowEl: eyebrowRef.current,
        headlineEl: headlineRef.current,
        fogEl: fogRef.current,
        setFrame,
      }
    }
  })

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="sequence-section"
      aria-label="Hero — Building Reveal"
    >
      {/* Canvas: full-section frame sequence renderer */}
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="sequence-canvas" />
      </div>

      {/* Fog / light overlay: radial gradient with vignette edges */}
      <div ref={fogRef} className="fog-overlay" aria-hidden="true" />

      {/* Typography: fades upward as sequence progresses */}
      <div className="text-overlay">
        <span ref={eyebrowRef} className="text-eyebrow">
          Level UP — Manilonda
        </span>
        <h1 ref={headlineRef} className="text-display" style={{ opacity: 0, transform: 'translateY(0px)' }}>
          Designed Around Life
        </h1>
      </div>

      {/* Static project info — bottom right, always visible */}
      <div className="section-info">
        <span className="section-info-label">Khajaguda &amp; Puppalaguda, Hyderabad</span>
        <p className="section-info-body">
          Premium residences set in Manilonda's most connected address —
          near Delhi Public School, Oakridge International, ORR, and Lanco Hills.
        </p>
        <p className="section-info-price">From ₹2.3 Cr*</p>
      </div>
    </section>
  )
})

export default HeroSection
