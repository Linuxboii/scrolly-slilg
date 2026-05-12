'use client'

// useImageSequence.js — Canvas rendering hook for image sequence playback.
//
// Design decisions:
// - Frame index stored in a ref, never in state → zero re-renders during scroll
// - Dirty flag pattern: only drawImage() when frame actually changed
// - If bitmap not loaded yet, dirty flag stays true → holds last rendered frame (no flicker)
// - DPR capped at 2: 3x screens (some phones) don't benefit visually but cost 2.25× GPU fill
// - ResizeObserver handles responsive canvas resizing
// - rAF loop is always running while mounted; rendering is conditional on dirty flag

import { useRef, useEffect, useCallback, useState } from 'react'
import { getFrame, getSectionLoadProgress } from '@/lib/imageSequenceEngine'

/**
 * @param {{ basePath: string, totalFrames: number }} options
 * @returns {{
 *   canvasRef: React.RefObject<HTMLCanvasElement>,
 *   setFrame: (index: number) => void,
 *   isLoaded: boolean,
 *   loadProgress: number
 * }}
 */
export default function useImageSequence({ basePath, totalFrames }) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)

  // Scroll-driven frame control — never triggers re-renders
  const frameIndexRef = useRef(0)
  const isDirtyRef = useRef(true) // start dirty so first frame renders immediately

  // DPR and canvas logical dimensions — updated by ResizeObserver
  const logicalSizeRef = useRef({ w: 0, h: 0 })

  // Loading state — these DO use state because they're for UI (LoadingScreen, etc.)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  // ─── Canvas setup and DPR scaling ───────────────────────────────────────────

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight

    // Physical pixel dimensions
    canvas.width = w * dpr
    canvas.height = h * dpr

    const ctx = canvas.getContext('2d')
    // Scale once at init: all subsequent drawImage calls use logical (CSS) px
    ctx.scale(dpr, dpr)
    ctxRef.current = ctx
    logicalSizeRef.current = { w, h }

    // Mark dirty so the new canvas size triggers a redraw
    isDirtyRef.current = true
  }, [])

  // ─── ResizeObserver ──────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    initCanvas()

    const ro = new ResizeObserver(() => {
      initCanvas()
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [initCanvas])

  // ─── rAF render loop ─────────────────────────────────────────────────────────

  useEffect(() => {
    let rafId

    function renderLoop() {
      if (isDirtyRef.current && ctxRef.current) {
        const bitmap = getFrame(basePath, frameIndexRef.current, totalFrames)

        if (bitmap) {
          const { w, h } = logicalSizeRef.current
          // Guard: skip draw if canvas has no layout yet
          if (w > 0 && h > 0 && bitmap.width > 0 && bitmap.height > 0) {
            // Cover-fit: maintain aspect ratio, crop edges (object-fit: cover)
            const imgAR = bitmap.width / bitmap.height
            const canvasAR = w / h
            let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height
            if (imgAR > canvasAR) {
              sw = Math.round(bitmap.height * canvasAR)
              sx = Math.round((bitmap.width - sw) / 2)
            } else {
              sh = Math.round(bitmap.width / canvasAR)
              sy = Math.round((bitmap.height - sh) / 2)
            }
            try {
              ctxRef.current.drawImage(bitmap, sx, sy, sw, sh, 0, 0, w, h)
              isDirtyRef.current = false
            } catch (_) {
              // drawImage can throw if canvas is detached; stay dirty and retry next frame
            }
          }
        }
        // If bitmap is null (still loading): keep isDirty = true
        // Next rAF tick will retry — holds last rendered frame in the meantime
      }

      rafId = requestAnimationFrame(renderLoop)
    }

    rafId = requestAnimationFrame(renderLoop)
    return () => cancelAnimationFrame(rafId)
  }, [basePath, totalFrames])

  // ─── Load progress polling ───────────────────────────────────────────────────

  useEffect(() => {
    if (isLoaded) return

    // Poll every 200ms to update load progress UI
    // This is deliberately coarse — high-frequency polling is wasteful
    const config = { basePath, frameCount: totalFrames }
    const interval = setInterval(() => {
      const progress = getSectionLoadProgress(config)
      setLoadProgress(progress)
      if (progress >= 1) {
        setIsLoaded(true)
        clearInterval(interval)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [basePath, totalFrames, isLoaded])

  // ─── Frame setter — called by GSAP ScrollTrigger on every scroll tick ────────

  // Must be sync and allocation-free: no closures, no new objects
  const setFrame = useCallback((index) => {
    if (frameIndexRef.current !== index) {
      frameIndexRef.current = index
      isDirtyRef.current = true
    }
  }, [])

  return { canvasRef, setFrame, isLoaded, loadProgress }
}
