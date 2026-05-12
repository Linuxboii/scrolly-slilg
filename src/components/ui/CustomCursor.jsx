'use client'

// CustomCursor.jsx — Replaces native cursor with a luxury two-layer cursor.
// Dot: 5px, follows exact mouse position instantly.
// Ring: 36px, lags behind at ~12% lerp per frame for fluid chase effect.
// Hover state: ring expands to 64px, fills with gold tint, dot hides.
// Uses rAF loop for lerp — no GSAP dependency.

import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const stateRef = useRef({
    mx: -100, my: -100,   // mouse position
    rx: -100, ry: -100,   // ring lerped position
    hovering: false,
    visible: false,
    rafId: null,
  })

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    const s = stateRef.current

    // ── Mouse tracking ────────────────────────────────────────────────────────
    function onMouseMove(e) {
      s.mx = e.clientX
      s.my = e.clientY
      if (!s.visible) {
        // Snap ring to mouse on first move to avoid it flying from (-100, -100)
        s.rx = e.clientX
        s.ry = e.clientY
        s.visible = true
        dot.style.opacity = '1'
        ring.style.opacity = '1'
      }
    }

    // ── Hover detection on interactive elements ───────────────────────────────
    function onMouseOver(e) {
      const target = e.target.closest('a, button, [data-cursor-hover], input, textarea, label')
      if (target) {
        s.hovering = true
        ring.classList.add('cursor-ring--hover')
        dot.classList.add('cursor-dot--hover')
      }
    }

    function onMouseOut(e) {
      const target = e.target.closest('a, button, [data-cursor-hover], input, textarea, label')
      if (target) {
        s.hovering = false
        ring.classList.remove('cursor-ring--hover')
        dot.classList.remove('cursor-dot--hover')
      }
    }

    function onMouseLeave() {
      dot.style.opacity = '0'
      ring.style.opacity = '0'
      s.visible = false
    }

    function onMouseEnter() {
      if (s.visible) {
        dot.style.opacity = '1'
        ring.style.opacity = '1'
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseout', onMouseOut)
    document.documentElement.addEventListener('mouseleave', onMouseLeave)
    document.documentElement.addEventListener('mouseenter', onMouseEnter)

    // ── rAF render loop ───────────────────────────────────────────────────────
    const LERP = 0.12

    function tick() {
      // Lerp ring toward mouse
      s.rx += (s.mx - s.rx) * LERP
      s.ry += (s.my - s.ry) * LERP

      dot.style.transform = `translate(${s.mx}px, ${s.my}px) translate(-50%, -50%)`
      ring.style.transform = `translate(${s.rx}px, ${s.ry}px) translate(-50%, -50%)`

      s.rafId = requestAnimationFrame(tick)
    }

    s.rafId = requestAnimationFrame(tick)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseout', onMouseOut)
      document.documentElement.removeEventListener('mouseleave', onMouseLeave)
      document.documentElement.removeEventListener('mouseenter', onMouseEnter)
      cancelAnimationFrame(s.rafId)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  )
}
