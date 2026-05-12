// scrollOrchestrator.js — GSAP + Lenis wiring for all scroll-driven animations.
//
// Architecture:
// - Lenis owns smooth scrolling; feeds into ScrollTrigger.update on every tick
// - ONE ScrollTrigger per section handles BOTH frame progression AND text animation
//   (text was previously in separate triggers which fired at wrong positions due to
//    pin-spacer insertion changing the DOM before text triggers calculated their start)
// - Text uses onEnter/onLeave/onUpdate callbacks — plays at GSAP speed (not scrub lag)
// - Overlays (fog, glow, light-leak, haze, exit) use separate scrub timelines (visual FX only)
// - Returns a single cleanup function

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { SECTIONS } from '@/config/sections'

gsap.registerPlugin(ScrollTrigger)

// ─── Text animation helpers ───────────────────────────────────────────────────

function initText(els) {
  const elements = [].concat(els).filter(Boolean)
  if (!elements.length) return
  gsap.set(elements, { opacity: 0, y: 55, filter: 'blur(6px)' })
}

function textIn(els, opts = {}) {
  const elements = [].concat(els).filter(Boolean)
  if (!elements.length) return
  gsap.killTweensOf(elements)
  gsap.to(elements, {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: 0.55,
    ease: 'power3.out',
    stagger: 0.09,
    ...opts,
  })
}

function textOut(els, dir = -1, opts = {}) {
  const elements = [].concat(els).filter(Boolean)
  if (!elements.length) return
  gsap.killTweensOf(elements)
  gsap.to(elements, {
    opacity: 0,
    y: dir * 40,
    filter: 'blur(5px)',
    duration: 0.3,
    ease: 'power2.in',
    stagger: 0.04,
    ...opts,
  })
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export function initScrollOrchestrator(sectionRefs, footerRef) {
  // ─── Lenis smooth scrolling ────────────────────────────────────────────────
  const lenis = new Lenis({
    duration: 1.6,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.6,
    smoothTouch: true,
    touchMultiplier: 0.8,
  })

  lenis.on('scroll', ScrollTrigger.update)

  const lenisTickerCallback = (time) => lenis.raf(time * 1000)
  gsap.ticker.add(lenisTickerCallback)
  gsap.ticker.lagSmoothing(0)

  const allTriggers = []

  // ─── Section 0: Hero ────────────────────────────────────────────────────────
  const hero = sectionRefs[0]?.current
  if (hero?.el) {
    initText([hero.eyebrowEl, hero.headlineEl])

    const h = { textIn: false }

    allTriggers.push(
      ScrollTrigger.create({
        trigger: hero.el,
        start: 'top top',
        end: `+=${SECTIONS[0].pinDuration}`,
        pin: true,
        pinSpacing: true,
        scrub: SECTIONS[0].scrub,
        onEnter: () => {
          h.textIn = true
          textIn([hero.eyebrowEl, hero.headlineEl])
        },
        onLeave: () => {
          h.textIn = false
          textOut([hero.eyebrowEl, hero.headlineEl], -1)
          const next = sectionRefs[1]?.current?.el
          if (next) lenis.scrollTo(next, { immediate: true })
        },
        onEnterBack: () => {
          h.textIn = true
          textIn([hero.eyebrowEl, hero.headlineEl])
        },
        onLeaveBack: () => {
          h.textIn = false
          textOut([hero.eyebrowEl, hero.headlineEl], 1)
        },
        onUpdate: (self) => {
          const p = self.progress
          const frame = Math.floor(p * (SECTIONS[0].frameCount - 1))
          hero.setFrame(frame)

          // Exit text at 72% of pin
          if (p > 0.72 && h.textIn) {
            h.textIn = false
            textOut([hero.eyebrowEl, hero.headlineEl], -1)
          } else if (p < 0.65 && !h.textIn && p > 0.02) {
            h.textIn = true
            textIn([hero.eyebrowEl, hero.headlineEl])
          }
        },
      })
    )

    // Fog overlay — visual FX only, stays on cinematic scrub
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
    initText([play.eyebrowEl, ...(play.wordEls || [])])

    const microcopyConfig = SECTIONS[1].textOverlays
    const wordActive = [false, false, false]
    let playEyebrowOut = false

    allTriggers.push(
      ScrollTrigger.create({
        trigger: play.el,
        start: 'top top',
        end: `+=${SECTIONS[1].pinDuration}`,
        pin: true,
        pinSpacing: true,
        scrub: SECTIONS[1].scrub,
        onEnter: () => {
          playEyebrowOut = false
          textIn(play.eyebrowEl, { delay: 0.15 })
        },
        onLeave: () => {
          playEyebrowOut = true
          textOut([play.eyebrowEl, ...(play.wordEls || [])], -1)
          wordActive.fill(false)
          const next = sectionRefs[2]?.current?.el
          if (next) lenis.scrollTo(next, { immediate: true })
        },
        onEnterBack: () => {
          playEyebrowOut = false
          textIn(play.eyebrowEl)
        },
        onLeaveBack: () => {
          textOut([play.eyebrowEl, ...(play.wordEls || [])], 1)
          wordActive.fill(false)
        },
        onUpdate: (self) => {
          const p = self.progress
          const frame = Math.floor(p * (SECTIONS[1].frameCount - 1))
          play.setFrame(frame)

          // Eyebrow exit at 88%
          if (p > 0.88 && !playEyebrowOut) {
            playEyebrowOut = true
            textOut(play.eyebrowEl, -1)
          } else if (p < 0.82 && playEyebrowOut && p > 0) {
            playEyebrowOut = false
            textIn(play.eyebrowEl)
          }

          // Microcopy words — each appears in its progress window
          play.wordEls?.forEach((wordEl, i) => {
            if (!wordEl) return
            const center = microcopyConfig[i].triggerProgress
            const half = 0.14
            const inRange = p >= center - half && p <= center + half

            if (inRange && !wordActive[i]) {
              wordActive[i] = true
              gsap.killTweensOf(wordEl)
              gsap.set(wordEl, { opacity: 0, y: 50, filter: 'blur(8px)' })
              gsap.to(wordEl, {
                opacity: 1, y: 0, filter: 'blur(0px)',
                duration: 0.5, ease: 'power3.out',
              })
            } else if (!inRange && wordActive[i]) {
              wordActive[i] = false
              const dir = p > center ? -1 : 1
              gsap.killTweensOf(wordEl)
              gsap.to(wordEl, {
                opacity: 0, y: dir * 38, filter: 'blur(6px)',
                duration: 0.3, ease: 'power2.in',
              })
            }
          })
        },
      })
    )

    // Zoom — canvas wrapper scales for depth
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
  }

  // ─── Section 2: Swimming ────────────────────────────────────────────────────
  const swim = sectionRefs[2]?.current
  if (swim?.el) {
    const wordEls = swim.wordEls?.filter(Boolean) || []
    initText([swim.eyebrowEl, ...wordEls])

    // Word entry thresholds (staggered scroll checkpoints)
    const wordThresholds = [0.08, 0.20, 0.32]
    const wordActive = new Array(wordEls.length).fill(false)
    let swimTextExited = false

    allTriggers.push(
      ScrollTrigger.create({
        trigger: swim.el,
        start: 'top top',
        end: `+=${SECTIONS[2].pinDuration}`,
        pin: true,
        pinSpacing: true,
        scrub: SECTIONS[2].scrub,
        onEnter: () => {
          swimTextExited = false
          textIn(swim.eyebrowEl, { delay: 0.1 })
        },
        onLeave: () => {
          swimTextExited = true
          textOut([swim.eyebrowEl, ...wordEls], -1)
          wordActive.fill(false)
          const next = sectionRefs[3]?.current?.el
          if (next) lenis.scrollTo(next, { immediate: true })
        },
        onEnterBack: () => {
          swimTextExited = false
          // Restore anything that was visible at current progress on next onUpdate tick
        },
        onLeaveBack: () => {
          swimTextExited = true
          textOut([swim.eyebrowEl, ...wordEls], 1)
          wordActive.fill(false)
        },
        onUpdate: (self) => {
          const p = self.progress
          const frame = Math.floor(p * (SECTIONS[2].frameCount - 1))
          swim.setFrame(frame)

          // Eyebrow in/out
          if (p < 0.05 && !swimTextExited) {
            textIn(swim.eyebrowEl)
          }

          // Words appear at thresholds, all exit together at 75%
          if (p < 0.75 && !swimTextExited) {
            wordEls.forEach((wordEl, i) => {
              if (!wordEl) return
              const threshold = wordThresholds[i] ?? 0.1

              if (p >= threshold && !wordActive[i]) {
                wordActive[i] = true
                gsap.killTweensOf(wordEl)
                gsap.set(wordEl, { opacity: 0, y: 55, filter: 'blur(8px)' })
                gsap.to(wordEl, {
                  opacity: 1, y: 0, filter: 'blur(0px)',
                  duration: 0.55, ease: 'power3.out',
                })
              } else if (p < threshold - 0.04 && wordActive[i]) {
                wordActive[i] = false
                gsap.killTweensOf(wordEl)
                gsap.to(wordEl, {
                  opacity: 0, y: 50, filter: 'blur(8px)',
                  duration: 0.3, ease: 'power2.in',
                })
              }
            })
          }

          // Group exit at 75%
          if (p > 0.75 && !swimTextExited) {
            swimTextExited = true
            textOut([swim.eyebrowEl, ...wordEls], -1)
            wordActive.fill(false)
          } else if (p < 0.70 && swimTextExited && p > 0.02) {
            swimTextExited = false
          }
        },
      })
    )

    // Water glow
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
    initText([sky.eyebrowEl, sky.headline1El, sky.headline2El])

    const skyState = { eyebrow: false, h1: false, h2: false }

    allTriggers.push(
      ScrollTrigger.create({
        trigger: sky.el,
        start: 'top top',
        end: `+=${SECTIONS[3].pinDuration}`,
        pin: true,
        pinSpacing: true,
        scrub: SECTIONS[3].scrub,
        onEnter: () => {
          skyState.eyebrow = true
          skyState.h1 = true
          textIn([sky.eyebrowEl], { delay: 0.1 })
          textIn([sky.headline1El], { delay: 0.25 })
        },
        onLeave: () => {
          Object.keys(skyState).forEach(k => { skyState[k] = false })
          textOut([sky.eyebrowEl, sky.headline1El, sky.headline2El], -1)
          // Snap to footer — no dead scroll zone between last frame and footer
          if (footerRef?.current) {
            lenis.scrollTo(footerRef.current, { immediate: true })
          }
        },
        onEnterBack: () => {
          // Reset to h1 visible state
          skyState.h1 = true
          skyState.eyebrow = true
          skyState.h2 = false
          gsap.set([sky.headline2El], { opacity: 0, y: 55 })
          textIn([sky.eyebrowEl, sky.headline1El])
        },
        onLeaveBack: () => {
          Object.keys(skyState).forEach(k => { skyState[k] = false })
          textOut([sky.eyebrowEl, sky.headline1El, sky.headline2El], 1)
        },
        onUpdate: (self) => {
          const p = self.progress
          const frame = Math.floor(p * (SECTIONS[3].frameCount - 1))
          sky.setFrame(frame)

          // Eyebrow: visible 0.01 – 0.38
          if (p > 0.38 && skyState.eyebrow) {
            skyState.eyebrow = false
            textOut(sky.eyebrowEl, -1)
          } else if (p < 0.33 && !skyState.eyebrow && p > 0.01) {
            skyState.eyebrow = true
            textIn(sky.eyebrowEl)
          }

          // H1 "Every Path": visible 0.01 – 0.44
          if (p > 0.44 && skyState.h1) {
            skyState.h1 = false
            textOut(sky.headline1El, -1)
          } else if (p < 0.38 && !skyState.h1 && p > 0.01) {
            skyState.h1 = true
            textIn(sky.headline1El)
          }

          // H2 "Leads Home": visible 0.54 – 0.90
          if (p >= 0.54 && p <= 0.90 && !skyState.h2) {
            skyState.h2 = true
            textIn(sky.headline2El, { delay: 0.1 })
          } else if ((p < 0.50 || p > 0.93) && skyState.h2) {
            skyState.h2 = false
            textOut(sky.headline2El, p > 0.90 ? -1 : 1)
          }
        },
      })
    )

    // Light leak
    if (sky.lightLeakEl) {
      const leakTl = gsap.timeline({ paused: true })
      leakTl
        .set(sky.lightLeakEl, { x: '100%', opacity: 0 })
        .to(sky.lightLeakEl, { opacity: 0, duration: 0.5, ease: 'none' })
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

    // Atmospheric haze
    if (sky.hazeEl) {
      const hazeTl = gsap.timeline({ paused: true })
      hazeTl.fromTo(sky.hazeEl, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: 'none' })
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

    // Exit overlay
    if (sky.exitOverlayEl) {
      const exitTl = gsap.timeline({ paused: true })
      exitTl
        .set(sky.exitOverlayEl, { opacity: 0 })
        .to(sky.exitOverlayEl, { opacity: 0, duration: 0.9, ease: 'none' })
        .to(sky.exitOverlayEl, { opacity: 1, duration: 0.1, ease: 'none' })
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
  // Trigger starts when footer top hits bottom of viewport (100%) so the
  // reveal fires immediately on snap-scroll from the sky section.
  if (footerRef?.current) {
    allTriggers.push(
      ScrollTrigger.create({
        trigger: footerRef.current,
        start: 'top 100%',
        end: 'top 30%',
        scrub: 1,
        onUpdate: (self) => {
          const p = self.progress
          footerRef.current.style.filter = `blur(${(1 - p) * 16}px)`
          footerRef.current.style.opacity = p.toString()
        },
      })
    )
  }

  // Force recalculate all trigger positions after full setup
  ScrollTrigger.refresh()

  // ─── Cleanup ───────────────────────────────────────────────────────────────
  return () => {
    allTriggers.forEach(t => t.kill())
    gsap.ticker.remove(lenisTickerCallback)
    lenis.destroy()
  }
}
