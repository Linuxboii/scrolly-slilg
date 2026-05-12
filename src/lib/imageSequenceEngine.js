// imageSequenceEngine.js — Core frame cache and progressive loading engine.
// Pure JS module (no React). Imported by useImageSequence hook and page.jsx.
//
// Design decisions:
// - createImageBitmap() decodes off-main-thread → GPU-ready bitmap, no jank
// - Map<url, ImageBitmap> cache — O(1) lookup during scroll
// - Dirty-set tracking prevents redundant fetches
// - bitmap.close() on eviction releases GPU texture memory (critical for 460+ frames)

import { MOBILE_FRAME_DENSITY, EAGER_FRAME_COUNT, PRELOAD_BATCH_SIZE } from '@/config/sections'

// ─── Global caches (shared across all section components) ─────────────────────

/** @type {Map<string, ImageBitmap>} */
const frameCache = new Map()

/** URLs currently being fetched — prevents duplicate in-flight requests */
const loadingSet = new Set()

/** URLs that failed to load — don't retry */
const errorSet = new Set()

// ─── URL helpers ──────────────────────────────────────────────────────────────

/**
 * Build the public URL for a given 0-based frame index.
 * Filenames are 1-based and zero-padded to 3 digits: 001, 002, … 120.
 *
 * @param {string} basePath  e.g. "/hero/ezgif-frame-"
 * @param {number} index     0-based frame index
 */
export function frameUrl(basePath, index) {
  return `${basePath}${String(index + 1).padStart(3, '0')}.jpg`
}

// ─── Feature detection ────────────────────────────────────────────────────────

// createImageBitmap() is supported in all modern browsers but has quirks in
// old Safari. Detect once and use img-based fallback when unavailable.
const canUseImageBitmap =
  typeof window !== 'undefined' && typeof createImageBitmap !== 'undefined'

/**
 * Load a single frame URL into an ImageBitmap (or HTMLImageElement fallback).
 * Returns a Promise that resolves to an ImageBitmap-compatible drawable.
 *
 * @param {string} url
 * @returns {Promise<ImageBitmap | HTMLImageElement>}
 */
async function loadFrame(url) {
  if (frameCache.has(url)) return frameCache.get(url)
  if (loadingSet.has(url) || errorSet.has(url)) return null

  loadingSet.add(url)

  try {
    if (canUseImageBitmap) {
      const response = await fetch(url)
      const blob = await response.blob()
      // premultiplyAlpha: 'none' avoids color fringing on JPEG edges
      const bitmap = await createImageBitmap(blob, { premultiplyAlpha: 'none' })
      frameCache.set(url, bitmap)
    } else {
      // Safari fallback: load via Image element
      const img = await new Promise((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = reject
        el.src = url
      })
      frameCache.set(url, img)
    }

    loadingSet.delete(url)
    return frameCache.get(url)
  } catch (err) {
    loadingSet.delete(url)
    errorSet.add(url)
    console.warn(`[imageSequenceEngine] Failed to load frame: ${url}`, err)
    return null
  }
}

// ─── Progressive loading ──────────────────────────────────────────────────────

/**
 * Preload a section's frames progressively.
 *
 * Priority 'immediate': loads first EAGER_FRAME_COUNT frames in parallel.
 *   Returns a Promise that resolves when those frames are cached.
 *   Call this before allowing the user to interact with the section.
 *
 * Priority 'background': loads remaining frames in small batches, yielding
 *   to the main thread between each batch to avoid jank during scroll.
 *   Returns immediately (fire-and-forget).
 *
 * @param {{ basePath: string, frameCount: number, id: string }} config
 * @param {'immediate' | 'background'} priority
 * @param {number} [delay=0]  ms to wait before starting background loads
 * @returns {Promise<void>}
 */
export async function preloadSection(config, priority = 'background', delay = 0) {
  const { basePath, frameCount } = config

  // Respect mobile frame density: only load every Nth frame on small screens
  const density = isMobile() ? MOBILE_FRAME_DENSITY : 1
  const indices = []
  for (let i = 0; i < frameCount; i += density) {
    indices.push(i)
  }

  if (priority === 'immediate') {
    // Load first EAGER_FRAME_COUNT frames in parallel — blocks until done
    const eagerCount = Math.min(EAGER_FRAME_COUNT, indices.length)
    const eagerUrls = indices.slice(0, eagerCount).map(i => frameUrl(basePath, i))
    await Promise.all(eagerUrls.map(loadFrame))

    // Kick off remaining in background (don't await)
    loadInBackground(indices.slice(eagerCount).map(i => frameUrl(basePath, i)))
  } else {
    // Background: wait for optional delay, then batch-load without blocking
    if (delay > 0) await new Promise(r => setTimeout(r, delay))
    const allUrls = indices.map(i => frameUrl(basePath, i))
    loadInBackground(allUrls)
  }
}

/**
 * Load URLs in batches of PRELOAD_BATCH_SIZE, yielding to main thread between
 * each batch via setTimeout(0). This keeps scroll jank-free during preload.
 *
 * @param {string[]} urls
 */
function loadInBackground(urls) {
  let cursor = 0

  function loadNextBatch() {
    if (cursor >= urls.length) return
    const batch = urls.slice(cursor, cursor + PRELOAD_BATCH_SIZE)
    cursor += PRELOAD_BATCH_SIZE
    // Parallel within batch, sequential between batches
    Promise.all(batch.map(loadFrame)).then(() => {
      setTimeout(loadNextBatch, 0)
    })
  }

  setTimeout(loadNextBatch, 0)
}

// ─── Frame retrieval ──────────────────────────────────────────────────────────

/**
 * Get a cached frame bitmap for rendering.
 * Returns null if the frame hasn't loaded yet — caller should hold the last
 * rendered frame (dirty-flag pattern prevents flicker).
 *
 * @param {string} basePath
 * @param {number} frameIndex  0-based, will be clamped and density-snapped
 * @param {number} totalFrames
 * @returns {ImageBitmap | HTMLImageElement | null}
 */
export function getFrame(basePath, frameIndex, totalFrames) {
  const density = isMobile() ? MOBILE_FRAME_DENSITY : 1
  // Snap to nearest loaded frame index
  const snapped = Math.round(frameIndex / density) * density
  const clamped = Math.max(0, Math.min(Math.round(snapped), totalFrames - 1))
  const url = frameUrl(basePath, clamped)
  return frameCache.get(url) ?? null
}

// ─── Memory eviction ──────────────────────────────────────────────────────────

/**
 * Evict all cached frames for a given section.
 * Call when a section is ±2 away from the current section to free GPU memory.
 * bitmap.close() releases the GPU texture — NOT calling this causes leaks.
 *
 * @param {{ basePath: string, frameCount: number }} config
 */
export function evictSection(config) {
  const { basePath, frameCount } = config
  for (let i = 0; i < frameCount; i++) {
    const url = frameUrl(basePath, i)
    const bitmap = frameCache.get(url)
    if (bitmap) {
      // Only ImageBitmap has .close(); HTMLImageElement fallback does not
      if (typeof bitmap.close === 'function') {
        bitmap.close()
      }
      frameCache.delete(url)
    }
  }
}

// ─── Load progress ────────────────────────────────────────────────────────────

/**
 * Returns [0, 1] fraction of frames loaded for a section.
 * Used by the useImageSequence hook to report loading progress.
 *
 * @param {{ basePath: string, frameCount: number }} config
 * @returns {number}
 */
export function getSectionLoadProgress(config) {
  const { basePath, frameCount } = config
  const density = isMobile() ? MOBILE_FRAME_DENSITY : 1
  let loaded = 0
  let total = 0
  for (let i = 0; i < frameCount; i += density) {
    total++
    if (frameCache.has(frameUrl(basePath, i))) loaded++
  }
  return total === 0 ? 0 : loaded / total
}

/**
 * Returns true when all EAGER_FRAME_COUNT frames for the first section are loaded.
 * Used to gate ScrollTrigger initialization.
 *
 * @param {{ basePath: string, frameCount: number }} config
 * @returns {boolean}
 */
export function isSectionEagerLoaded(config) {
  const { basePath, frameCount } = config
  const density = isMobile() ? MOBILE_FRAME_DENSITY : 1
  const count = Math.min(EAGER_FRAME_COUNT, Math.ceil(frameCount / density))
  for (let i = 0; i < count; i++) {
    const idx = i * density
    if (!frameCache.has(frameUrl(basePath, idx))) return false
  }
  return true
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function isMobile() {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}
