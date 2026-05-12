'use client'

// page.jsx — Root orchestrator. Composes all sections and wires up scroll.
//
// Load sequence:
// 1. On mount: preload hero section's first 20 frames (immediate priority)
// 2. When hero frames ready: hide loading screen, init ScrollTrigger + Lenis
// 3. Background: preload remaining 3 sections staggered 600ms apart
//
// Architecture note:
// Section components expose their DOM elements + setFrame via refs.
// The scroll orchestrator receives these refs directly — no prop drilling
// of frame indices (which would cause re-renders on every scroll tick).

import { useRef, useEffect, useState, useCallback } from 'react'
import { preloadSection } from '@/lib/imageSequenceEngine'
import { initScrollOrchestrator } from '@/lib/scrollOrchestrator'
import { SECTIONS } from '@/config/sections'

import HeroSection from '@/components/sections/HeroSection'
import PlayAreaSection from '@/components/sections/PlayAreaSection'
import SwimmingSection from '@/components/sections/SwimmingSection'
import SkyWalkingSection from '@/components/sections/SkyWalkingSection'
import Footer from '@/components/Footer'
import LoadingScreen from '@/components/ui/LoadingScreen'
import NoiseOverlay from '@/components/ui/NoiseOverlay'
import CustomCursor from '@/components/ui/CustomCursor'

export default function Home() {
  // Each section ref exposes: { el, setFrame, ...domRefs }
  const heroRef = useRef(null)
  const playRef = useRef(null)
  const swimRef = useRef(null)
  const skyRef = useRef(null)
  const footerRef = useRef(null)

  const [isReady, setIsReady] = useState(false)
  const [heroLoadProgress, setHeroLoadProgress] = useState(0)
  const orchestratorCleanupRef = useRef(null)

  // ─── Step 1: Preload hero on mount ────────────────────────────────────────
  useEffect(() => {
    let unmounted = false

    async function bootstrap() {
      // Preload first 20 hero frames immediately — blocks until done
      await preloadSection(SECTIONS[0], 'immediate')

      if (unmounted) return
      setIsReady(true)

      // Background preload remaining sections, staggered to not saturate bandwidth
      preloadSection(SECTIONS[1], 'background', 0)
      preloadSection(SECTIONS[2], 'background', 600)
      preloadSection(SECTIONS[3], 'background', 1200)
    }

    bootstrap()
    return () => { unmounted = true }
  }, [])

  // ─── Step 2: Init scroll orchestrator once ready ──────────────────────────
  useEffect(() => {
    if (!isReady) return

    // Small delay to ensure all section refs have settled after state update
    const timer = setTimeout(() => {
      const sectionRefs = [heroRef, playRef, swimRef, skyRef]
      orchestratorCleanupRef.current = initScrollOrchestrator(sectionRefs, footerRef)
    }, 100)

    return () => {
      clearTimeout(timer)
      if (orchestratorCleanupRef.current) {
        orchestratorCleanupRef.current()
        orchestratorCleanupRef.current = null
      }
    }
  }, [isReady])

  // ─── Frame setter registration (passed down to each section) ─────────────
  // Sections call onSetFrame(fn) after their useImageSequence hook initializes.
  // This wires setFrame into the ref that scrollOrchestrator reads from.
  // Using callbacks (not state) ensures no re-renders.

  const handleHeroSetFrame = useCallback((fn) => {
    if (heroRef.current) heroRef.current.setFrame = fn
  }, [])

  const handlePlaySetFrame = useCallback((fn) => {
    if (playRef.current) playRef.current.setFrame = fn
  }, [])

  const handleSwimSetFrame = useCallback((fn) => {
    if (swimRef.current) swimRef.current.setFrame = fn
  }, [])

  const handleSkySetFrame = useCallback((fn) => {
    if (skyRef.current) skyRef.current.setFrame = fn
  }, [])

  return (
    <main style={{ background: 'var(--color-void)' }}>
      {/* Loading screen: visible until hero frames are ready */}
      <LoadingScreen isVisible={!isReady} progress={heroLoadProgress} />

      {/* Film grain — fixed, always on top */}
      <NoiseOverlay />

      {/* Custom cursor — dot + lagged ring, gold hover state */}
      <CustomCursor />

      {/* Scroll sections */}
      <HeroSection
        ref={heroRef}
        onSetFrame={handleHeroSetFrame}
      />
      <PlayAreaSection
        ref={playRef}
        onSetFrame={handlePlaySetFrame}
      />
      <SwimmingSection
        ref={swimRef}
        onSetFrame={handleSwimSetFrame}
      />
      <SkyWalkingSection
        ref={skyRef}
        onSetFrame={handleSkySetFrame}
      />

      {/* Footer: revealed via blur+opacity in scrollOrchestrator */}
      <Footer ref={footerRef} />
    </main>
  )
}
