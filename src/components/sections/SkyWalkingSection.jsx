'use client'

// SkyWalkingSection.jsx — Aerial top-down → eye-level walking experience.
// The most cinematic section: scrub: 2 (slowest), 300vh pin duration.
// Two sequential headlines with independent timelines.
// Light leak sweeps horizontally between frames 60–90.
// Atmospheric haze fades out as camera descends to eye level.
// Exit overlay fades in at the end, merging seamlessly with the footer.

import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react'
import useImageSequence from '@/hooks/useImageSequence'
import { SECTIONS } from '@/config/sections'

const config = SECTIONS[3]

const SkyWalkingSection = forwardRef(function SkyWalkingSection({ onSetFrame }, ref) {
  const sectionRef = useRef(null)
  const eyebrowRef = useRef(null)     // "Connected Living"
  const headline1Ref = useRef(null)   // "Every Path"
  const headline2Ref = useRef(null)   // "Leads Home"
  const lightLeakRef = useRef(null)
  const hazRef = useRef(null)
  const exitOverlayRef = useRef(null)

  const { canvasRef, setFrame } = useImageSequence({
    basePath: config.basePath,
    totalFrames: config.frameCount,
  })

  useImperativeHandle(ref, () => ({
    el: sectionRef.current,
    eyebrowEl: eyebrowRef.current,
    headline1El: headline1Ref.current,
    headline2El: headline2Ref.current,
    lightLeakEl: lightLeakRef.current,
    hazeEl: hazRef.current,
    exitOverlayEl: exitOverlayRef.current,
    setFrame,
  }))

  useEffect(() => {
    if (onSetFrame) onSetFrame(setFrame)
  }, [onSetFrame, setFrame])

  useEffect(() => {
    if (ref && 'current' in ref) {
      ref.current = {
        el: sectionRef.current,
        eyebrowEl: eyebrowRef.current,
        headline1El: headline1Ref.current,
        headline2El: headline2Ref.current,
        lightLeakEl: lightLeakRef.current,
        hazeEl: hazRef.current,
        exitOverlayEl: exitOverlayRef.current,
        setFrame,
      }
    }
  })

  return (
    <section
      ref={sectionRef}
      id="sky-walking"
      className="sequence-section"
      aria-label="Sky to Walking Path Experience"
    >
      {/* Sequence canvas */}
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="sequence-canvas" />
      </div>

      {/* Atmospheric haze: top-edge gradient, fades as camera descends */}
      <div ref={hazRef} className="atmos-haze" aria-hidden="true" />

      {/* Light leak: sweeps across the frame between seq. midpoint frames */}
      <div ref={lightLeakRef} className="light-leak" aria-hidden="true" />

      {/* Typography: eyebrow + two sequential headlines */}
      {/* "Connected Living" eyebrow + "Every Path" — appears early, fades before midpoint */}
      <div
        className="text-overlay"
        style={{ justifyContent: 'flex-end', alignItems: 'flex-start' }}
      >
        <span ref={eyebrowRef} className="text-eyebrow" style={{ opacity: 0, marginBottom: '1rem' }}>
          Connected Living
        </span>
        <h2
          ref={headline1Ref}
          className="text-display"
          style={{ opacity: 0 }}
        >
          Every Path
        </h2>
      </div>

      {/* "Leads Home" — appears after midpoint, holds until near end */}
      <div
        className="text-overlay"
        style={{ justifyContent: 'flex-end', alignItems: 'flex-end', textAlign: 'right' }}
      >
        <h2
          ref={headline2Ref}
          className="text-display"
          style={{ opacity: 0 }}
        >
          Leads Home
        </h2>
      </div>

      {/* Exit overlay: fades to black as section exits, merges with footer */}
      <div ref={exitOverlayRef} className="exit-overlay" aria-hidden="true" />
    </section>
  )
})

export default SkyWalkingSection
