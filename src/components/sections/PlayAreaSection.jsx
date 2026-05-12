'use client'

// PlayAreaSection.jsx — Badminton court → children's play area.
// Three microcopy words appear and vanish at specific scroll milestones.
// A subtle zoom applied to the canvas wrapper creates depth as the camera
// transitions between the two spaces.
// Each microcopy word has its own ref so the orchestrator can create
// individual short-window ScrollTrigger instances per word.

import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react'
import useImageSequence from '@/hooks/useImageSequence'
import { SECTIONS } from '@/config/sections'

const config = SECTIONS[1]

const PlayAreaSection = forwardRef(function PlayAreaSection({ onSetFrame }, ref) {
  const sectionRef = useRef(null)
  const canvasWrapperRef = useRef(null)

  // Individual refs for each microcopy word
  const word0Ref = useRef(null) // "Movement"
  const word1Ref = useRef(null) // "Community"
  const word2Ref = useRef(null) // "Belonging"

  const { canvasRef, setFrame } = useImageSequence({
    basePath: config.basePath,
    totalFrames: config.frameCount,
  })

  useImperativeHandle(ref, () => ({
    el: sectionRef.current,
    canvasWrapperEl: canvasWrapperRef.current,
    wordEls: [word0Ref.current, word1Ref.current, word2Ref.current],
    setFrame,
  }))

  useEffect(() => {
    if (onSetFrame) onSetFrame(setFrame)
  }, [onSetFrame, setFrame])

  useEffect(() => {
    if (ref && 'current' in ref) {
      ref.current = {
        el: sectionRef.current,
        canvasWrapperEl: canvasWrapperRef.current,
        wordEls: [word0Ref.current, word1Ref.current, word2Ref.current],
        setFrame,
      }
    }
  })

  return (
    <section
      ref={sectionRef}
      id="play-area"
      className="sequence-section"
      aria-label="Play Area — Badminton to Children's Zone"
    >
      {/* Canvas wrapper: GSAP applies scale(1 → 1.08) here for zoom effect */}
      <div ref={canvasWrapperRef} className="canvas-wrapper">
        <canvas ref={canvasRef} className="sequence-canvas" />
      </div>

      {/* Microcopy words: each positioned center, animated independently */}
      <div className="microcopy-container">
        <span ref={word0Ref} className="microcopy-word">Movement</span>
        <span ref={word1Ref} className="microcopy-word">Community</span>
        <span ref={word2Ref} className="microcopy-word">Belonging</span>
      </div>

      {/* Static amenities info */}
      <div className="section-info">
        <span className="section-info-label">World-Class Amenities</span>
        <p className="section-info-body">
          Championship badminton courts, a dedicated children's play zone, and open
          community lawns — spaces where every generation feels at home.
        </p>
      </div>
    </section>
  )
})

export default PlayAreaSection
