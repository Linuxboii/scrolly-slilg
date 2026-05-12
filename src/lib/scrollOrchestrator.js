// scrollOrchestrator.js — GSAP + Lenis wiring for all scroll-driven animations.
// Plain JS module (not a React hook). Initialized once in page.jsx after sections mount.
//
// Architecture:
// - Lenis owns smooth scrolling; feeds into ScrollTrigger.update on every tick
// - Per-section ScrollTrigger for frame progression (onUpdate → setFrame)
// - Separate text animation timelines scrubbed by their own ScrollTrigger instances
// - All text animations use ease: 'none' — any easing causes drift during scrub
// - Returns a single cleanup function to kill all triggers and destroy Lenis

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { SECTIONS } from '@/config/sections'

gsap.registerPlugin(ScrollTrigger)

/**
 * Initialize scroll orchestration for all sections.
 *
 * @param {Array<{ current: object }>} sectionRefs
 *   Each ref.current exposes: { el, setFrame, ...domRefs }
 * @param {{ current: HTMLElement }>} footerRef
 * @returns {() => void} cleanup
 */
export function initScrollOrchestrator(sectionRefs, footerRef) {
  // ─── Lenis smooth scrolling ────────────────────────────────────────────────
  const lenis = new Lenis({
    duration: 1.6,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    // 0.6 = each wheel tick moves 60% of normal distance — cinematic pace
    wheelMultiplier: 0.6,
    smoothTouch: true,
    touchMultiplier: 0.8,
  })

  // Critical Lenis + ScrollTrigger integration:
  // Lenis fires scroll events with its smooth position; ScrollTrigger must
  // use that position — NOT the native window.scrollY — or they desync.
  lenis.on('scroll', ScrollTrigger.update)

  // Feed Lenis into GSAP's RAF. GSAP runs at ~60fps; Lenis.raf() expects ms.
  // Store reference so we can remove it exactly on cleanup (reference equality).
  const lenisTickerCallback = (time) => lenis.raf(time * 1000)
  gsap.ticker.add(lenisTickerCallback)

  // Disable GSAP's lag smoothing — it introduces frame-skip compensation that
  // fights Lenis's own smoothing and causes stuttery playback.
  gsap.ticker.lagSmoothing(0)

  const allTriggers = []

  // ─── Section 0: Hero ────────────────────────────────────────────────────────
  const hero = sectionRefs[0]?.current
  if (hero?.el) {
    // Frame progression trigger
    allTriggers.push(
      ScrollTrigger.create({
        trigger: hero.el,
        start: 'top top',
        end: `+=${SECTIONS[0].pinDuration}`,
        pin: true,
        pinSpacing: true,
        scrub: SECTIONS[0].scrub,
        onUpdate: (self) => {
          const frame = Math.floor(self.progress * (SECTIONS[0].frameCount - 1))
          hero.setFrame(frame)
        },
      })
    )

    // Text animation: blast in from below → long hold → punch out upward
    if (hero.eyebrowEl && hero.headlineEl) {
      const heroTextTl = gsap.timeline({ paused: true })
      // 0.00 – 0.14: blast up from y:120
      heroTextTl.fromTo(
        [hero.eyebrowEl, hero.headlineEl],
        { opacity: 0, y: 120 },
        { opacity: 1, y: 0, duration: 0.14, ease: 'none', stagger: 0.06 }
      )
      // 0.14 – 0.68: implicit hold (user scrolls through ~3+ steps seeing text)
      // 0.68 – 0.84: punch out upward fast
      heroTextTl.to(
        [hero.eyebrowEl, hero.headlineEl],
        { opacity: 0, y: -120, duration: 0.14, ease: 'none', stagger: 0.04 },
        0.68
      )

      allTriggers.push(
        ScrollTrigger.create({
          trigger: hero.el,
          start: 'top top',
          end: `+=${SECTIONS[0].pinDuration}`,
          scrub: SECTIONS[0].scrub,
          animation: heroTextTl,
        })
      )
    }

    // Fog overlay: fades in subtly, holds, then fades out
    if (hero.fogEl) {
      const fogTl = gsap.timeline({ paused: true })
      fogTl
        .fromTo(hero.fogEl, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none' })
        .to(hero.fogEl, { opacity: 0.4, duration: 0.4, ease: 'none' })
        .to(hero.fogEl, { opacity: 0, duration: 0.3, ease: 'none' })

      allTriggers.push(
        ScrollTrigger.create({
          trigger: hero.el,
          start: 'top top',
          end: `+=${SECTIONS[0].pinDuration}`,
          scrub: SECTIONS[0].scrub,
          animation: fogTl,
        })
      )
    }
  }

  // ─── Section 1: Play Area ───────────────────────────────────────────────────
  const play = sectionRefs[1]?.current
  if (play?.el) {
    // Frame progression
    allTriggers.push(
      ScrollTrigger.create({
        trigger: play.el,
        start: 'top top',
        end: `+=${SECTIONS[1].pinDuration}`,
        pin: true,
        pinSpacing: true,
        scrub: SECTIONS[1].scrub,
        onUpdate: (self) => {
          const frame = Math.floor(self.progress * (SECTIONS[1].frameCount - 1))
          play.setFrame(frame)
        },
      })
    )

    // Zoom: canvas wrapper scales 1 → 1.08 over full section
    if (play.canvasWrapperEl) {
      const zoomTl = gsap.timeline({ paused: true })
      zoomTl.fromTo(
        play.canvasWrapperEl,
        { scale: 1 },
        { scale: 1.08, duration: 1, ease: 'none' }
      )
      allTriggers.push(
        ScrollTrigger.create({
          trigger: play.el,
          start: 'top top',
          end: `+=${SECTIONS[1].pinDuration}`,
          scrub: SECTIONS[1].scrub,
          animation: zoomTl,
        })
      )
    }

    // Microcopy words: each has a ~15% scroll window centered at triggerProgress
    const microcopyConfig = SECTIONS[1].textOverlays
    const sectionEl = play.el

    play.wordEls?.forEach((wordEl, i) => {
      if (!wordEl) return
      const center = microcopyConfig[i].triggerProgress
      const half = 0.14 // 28% window per word — user gets ~3 scroll steps of hold
      const pinDurVh = parseInt(SECTIONS[1].pinDuration)

      const startPct = `${Math.max(0, center - half) * 100}%`
      const endPct = `${Math.min(1, center + half) * 100}%`

      // Blast in from below, long hold, punch out upward
      const wordTl = gsap.timeline({ paused: true })
      wordTl
        .fromTo(
          wordEl,
          { opacity: 0, y: 80, filter: 'blur(8px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.25, ease: 'none' }
        )
        // hold: 0.25 – 0.75 (half the window is pure hold)
        .to(
          wordEl,
          { opacity: 0, y: -80, filter: 'blur(8px)', duration: 0.25, ease: 'none' },
          0.75
        )

      allTriggers.push(
        ScrollTrigger.create({
          trigger: sectionEl,
          start: `top+=${parseFloat(startPct) / 100 * pinDurVh * window.innerHeight / 100} top`,
          end: `top+=${parseFloat(endPct) / 100 * pinDurVh * window.innerHeight / 100} top`,
          scrub: SECTIONS[1].scrub,
          animation: wordTl,
        })
      )
    })
  }

  // ─── Section 2: Swimming ────────────────────────────────────────────────────
  const swim = sectionRefs[2]?.current
  if (swim?.el) {
    // Frame progression
    allTriggers.push(
      ScrollTrigger.create({
        trigger: swim.el,
        start: 'top top',
        end: `+=${SECTIONS[2].pinDuration}`,
        pin: true,
        pinSpacing: true,
        scrub: SECTIONS[2].scrub,
        onUpdate: (self) => {
          const frame = Math.floor(self.progress * (SECTIONS[2].frameCount - 1))
          swim.setFrame(frame)
        },
      })
    )

    // Word-by-word: each blasts up staggered → long hold → all punch out together
    const wordEls = swim.wordEls?.filter(Boolean)
    if (wordEls?.length) {
      const wordTl = gsap.timeline({ paused: true })
      // 0.00 – 0.30: words fly in one by one from y:100
      wordTl.fromTo(
        wordEls,
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          duration: 0.18,
          ease: 'none',
          stagger: { each: 0.08, from: 'start' },
        }
      )
      // 0.30 – 0.72: hold (user reads comfortably through multiple scroll steps)
      // 0.72 – 0.88: all words punch upward and out together
      wordTl.to(
        wordEls,
        { opacity: 0, y: -100, duration: 0.16, ease: 'none' },
        0.72
      )

      allTriggers.push(
        ScrollTrigger.create({
          trigger: swim.el,
          start: 'top top',
          end: `+=${SECTIONS[2].pinDuration}`,
          scrub: SECTIONS[2].scrub,
          animation: wordTl,
        })
      )
    }

    // Water glow: pulses opacity at section midpoint
    if (swim.waterGlowEl) {
      const glowTl = gsap.timeline({ paused: true })
      glowTl
        .to(swim.waterGlowEl, { opacity: 1, duration: 0.4, ease: 'none' })
        .to(swim.waterGlowEl, { opacity: 0.5, duration: 0.6, ease: 'none' })

      allTriggers.push(
        ScrollTrigger.create({
          trigger: swim.el,
          start: 'top top',
          end: `+=${SECTIONS[2].pinDuration}`,
          scrub: SECTIONS[2].scrub,
          animation: glowTl,
        })
      )
    }
  }

  // ─── Section 3: Sky-Walking ─────────────────────────────────────────────────
  const sky = sectionRefs[3]?.current
  if (sky?.el) {
    // Frame progression (slowest scrub for extended cinematic feel)
    allTriggers.push(
      ScrollTrigger.create({
        trigger: sky.el,
        start: 'top top',
        end: `+=${SECTIONS[3].pinDuration}`,
        pin: true,
        pinSpacing: true,
        scrub: SECTIONS[3].scrub,
        onUpdate: (self) => {
          const frame = Math.floor(self.progress * (SECTIONS[3].frameCount - 1))
          sky.setFrame(frame)
        },
      })
    )

    // Headline 1: "Every Path" — blasts in, holds through ~40% of scroll, punches out
    if (sky.headline1El) {
      const h1Tl = gsap.timeline({ paused: true })
      // fly in: 0.00 – 0.12
      h1Tl.fromTo(
        sky.headline1El,
        { opacity: 0, y: 120 },
        { opacity: 1, y: 0, duration: 0.12, ease: 'none' }
      )
      // hold: 0.12 – 0.40 (user scrolls 3+ steps reading it)
      // punch out: 0.40 – 0.54
      h1Tl.to(
        sky.headline1El,
        { opacity: 0, y: -120, duration: 0.14, ease: 'none' },
        0.40
      )

      allTriggers.push(
        ScrollTrigger.create({
          trigger: sky.el,
          start: 'top top',
          end: `+=${SECTIONS[3].pinDuration}`,
          scrub: SECTIONS[3].scrub,
          animation: h1Tl,
        })
      )
    }

    // Headline 2: "Leads Home" — waits for h1 to clear, then blasts in, holds, punches out
    if (sky.headline2El) {
      const h2Tl = gsap.timeline({ paused: true })
      h2Tl
        // hold invisible until h1 is gone: 0.00 – 0.55
        .set(sky.headline2El, { opacity: 0, y: 120 })
        .to(sky.headline2El, { opacity: 0, y: 120, duration: 0.55, ease: 'none' })
        // fly in: 0.55 – 0.67
        .to(sky.headline2El, { opacity: 1, y: 0, duration: 0.12, ease: 'none' })
        // hold: 0.67 – 0.87 (another 2+ scroll steps)
        .to(sky.headline2El, { opacity: 1, y: 0, duration: 0.20, ease: 'none' })
        // punch out: 0.87 – 1.00
        .to(sky.headline2El, { opacity: 0, y: -120, duration: 0.13, ease: 'none' })

      allTriggers.push(
        ScrollTrigger.create({
          trigger: sky.el,
          start: 'top top',
          end: `+=${SECTIONS[3].pinDuration}`,
          scrub: SECTIONS[3].scrub,
          animation: h2Tl,
        })
      )
    }

    // Light leak: sweeps right → left between progress 0.5–0.75
    if (sky.lightLeakEl) {
      const leakTl = gsap.timeline({ paused: true })
      leakTl
        .set(sky.lightLeakEl, { x: '100%', opacity: 0 })
        .to(sky.lightLeakEl, { opacity: 0, duration: 0.5, ease: 'none' }) // invisible first half
        .to(sky.lightLeakEl, { opacity: 1, x: '0%', duration: 0.12, ease: 'none' })
        .to(sky.lightLeakEl, { opacity: 0, x: '-100%', duration: 0.13, ease: 'none' })

      allTriggers.push(
        ScrollTrigger.create({
          trigger: sky.el,
          start: 'top top',
          end: `+=${SECTIONS[3].pinDuration}`,
          scrub: SECTIONS[3].scrub,
          animation: leakTl,
        })
      )
    }

    // Atmospheric haze: visible at start (aerial view), fades out by mid-scroll
    if (sky.hazeEl) {
      const hazeTl = gsap.timeline({ paused: true })
      hazeTl
        .fromTo(sky.hazeEl, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: 'none' })

      allTriggers.push(
        ScrollTrigger.create({
          trigger: sky.el,
          start: 'top top',
          end: `+=${SECTIONS[3].pinDuration}`,
          scrub: SECTIONS[3].scrub,
          animation: hazeTl,
        })
      )
    }

    // Exit overlay: section fades to black in final 10% of scroll
    if (sky.exitOverlayEl) {
      const exitTl = gsap.timeline({ paused: true })
      exitTl
        .set(sky.exitOverlayEl, { opacity: 0 })
        .to(sky.exitOverlayEl, { opacity: 0, duration: 0.9, ease: 'none' })  // hold transparent
        .to(sky.exitOverlayEl, { opacity: 1, duration: 0.1, ease: 'none' })  // fast black fade

      allTriggers.push(
        ScrollTrigger.create({
          trigger: sky.el,
          start: 'top top',
          end: `+=${SECTIONS[3].pinDuration}`,
          scrub: SECTIONS[3].scrub,
          animation: exitTl,
        })
      )
    }
  }

  // ─── Footer reveal ─────────────────────────────────────────────────────────
  // The footer starts blurred + invisible (set in globals.css).
  // Reveal triggers as the last pinned section exits.
  if (footerRef?.current) {
    allTriggers.push(
      ScrollTrigger.create({
        trigger: footerRef.current,
        start: 'top 90%',
        end: 'top 40%',
        scrub: 1.5,
        onUpdate: (self) => {
          const p = self.progress
          // Drive filter + opacity via inline style for GPU-composited animation
          footerRef.current.style.filter = `blur(${(1 - p) * 16}px)`
          footerRef.current.style.opacity = p.toString()
        },
      })
    )
  }

  // ─── Cleanup ───────────────────────────────────────────────────────────────
  return () => {
    allTriggers.forEach(t => t.kill())
    gsap.ticker.remove(lenisTickerCallback)
    lenis.destroy()
  }
}
