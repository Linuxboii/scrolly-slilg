'use client'

// SwimmingSection.jsx — Balcony → swimming pool reveal.
// Headline reveals word-by-word via staggered opacity (no SplitText license needed).
// Water glow overlay reacts to scroll progress.
// Particle canvas runs its own independent rAF — completely separate from the
// sequence canvas to avoid interfering with the dirty-flag render loop.

import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react'
import useImageSequence from '@/hooks/useImageSequence'
import { SECTIONS } from '@/config/sections'

const config = SECTIONS[2]

// Split headline into word spans at module load — no runtime cost during scroll
const HEADLINE_WORDS = 'Where Architecture Breathes'.split(' ')

// ─── Particle system ──────────────────────────────────────────────────────────

function startParticles(canvas) {
  const ctx = canvas.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  const resize = () => {
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)
  }
  resize()

  const ro = new ResizeObserver(resize)
  ro.observe(canvas)

  // 18 soft floating ellipses — subtle, not distracting
  const particles = Array.from({ length: 18 }, () => ({
    x: Math.random(),       // normalized 0–1
    y: Math.random(),
    rx: 1 + Math.random() * 2.5,   // semi-axis x
    ry: 0.4 + Math.random() * 1.2, // semi-axis y (flatter = water-like)
    speed: 0.00015 + Math.random() * 0.0003,
    phase: Math.random() * Math.PI * 2,
    alpha: 0.03 + Math.random() * 0.07,
  }))

  let rafId
  let t = 0

  function draw() {
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    ctx.clearRect(0, 0, w, h)

    for (const p of particles) {
      // Slow vertical drift with slight oscillation
      const px = p.x * w
      const py = ((p.y + t * p.speed) % 1) * h
      const pulse = 0.6 + 0.4 * Math.sin(t * 0.8 + p.phase)

      ctx.beginPath()
      ctx.ellipse(px, py, p.rx * pulse, p.ry * pulse, 0, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(160, 220, 255, ${p.alpha * pulse})`
      ctx.fill()
    }

    t += 1
    rafId = requestAnimationFrame(draw)
  }

  rafId = requestAnimationFrame(draw)

  // Return cleanup
  return () => {
    cancelAnimationFrame(rafId)
    ro.disconnect()
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const SwimmingSection = forwardRef(function SwimmingSection({ onSetFrame }, ref) {
  const sectionRef = useRef(null)
  const waterGlowRef = useRef(null)
  const particleCanvasRef = useRef(null)
  const eyebrowRef = useRef(null) // "Wellness & Leisure"
  const headlineRef = useRef(null)
  // Individual word refs for staggered GSAP animation
  const wordRefs = useRef(HEADLINE_WORDS.map(() => ({ current: null })))

  const { canvasRef, setFrame } = useImageSequence({
    basePath: config.basePath,
    totalFrames: config.frameCount,
  })

  useImperativeHandle(ref, () => ({
    el: sectionRef.current,
    waterGlowEl: waterGlowRef.current,
    eyebrowEl: eyebrowRef.current,
    headlineEl: headlineRef.current,
    wordEls: wordRefs.current.map(r => r.current),
    setFrame,
  }))

  useEffect(() => {
    if (onSetFrame) onSetFrame(setFrame)
  }, [onSetFrame, setFrame])

  useEffect(() => {
    if (ref && 'current' in ref) {
      ref.current = {
        el: sectionRef.current,
        waterGlowEl: waterGlowRef.current,
        eyebrowEl: eyebrowRef.current,
        headlineEl: headlineRef.current,
        wordEls: wordRefs.current.map(r => r.current),
        setFrame,
      }
    }
  })

  // Start particle system after mount
  useEffect(() => {
    const canvas = particleCanvasRef.current
    if (!canvas) return
    return startParticles(canvas)
  }, [])

  return (
    <section
      ref={sectionRef}
      id="swimming"
      className="sequence-section"
      aria-label="Swimming Pool Reveal"
    >
      {/* Sequence canvas */}
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="sequence-canvas" />
      </div>

      {/* Water glow: reflective light at bottom of frame */}
      <div ref={waterGlowRef} className="water-glow" aria-hidden="true" />

      {/* Ambient particles: separate canvas, independent rAF */}
      <canvas
        ref={particleCanvasRef}
        className="particle-canvas"
        aria-hidden="true"
      />

      {/* Word-by-word headline + eyebrow */}
      <div className="text-overlay" style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 0 }}>
        <span ref={eyebrowRef} className="text-eyebrow" style={{ opacity: 0, textAlign: 'center', marginBottom: '1.25rem' }}>
          Wellness &amp; Leisure
        </span>
        <h2
          ref={headlineRef}
          className="text-headline"
          style={{ textAlign: 'center', lineHeight: 1.3 }}
        >
          {HEADLINE_WORDS.map((word, i) => (
            <span
              key={word}
              ref={el => { wordRefs.current[i] = { current: el } }}
              className="word-reveal"
              style={{ marginRight: i < HEADLINE_WORDS.length - 1 ? '0.35em' : 0 }}
            >
              {word}
            </span>
          ))}
        </h2>
      </div>
    </section>
  )
})

export default SwimmingSection
