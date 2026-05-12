# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build — verify before shipping
npm run lint     # ESLint via next lint
npm run start    # Serve production build
```

If the dev server starts on port 3001, a stale process is likely holding 3000. Kill it: `taskkill /F /IM node.exe` (Windows), then re-run `npm run dev`.

**Do NOT manually delete `.next/`** — forces cold rebuilds and worsens OneDrive interference. The webpack cache warnings (`1.pack.gz_` rename errors) are non-fatal; the site builds correctly despite them.

## Architecture

Next.js 14 App Router site. Four full-screen pinned sections, each playing a 120-frame JPEG sequence driven entirely by scroll position. No autoplay — scroll is the only driver.

### Data flow

```
scroll position
  → Lenis (smooth scroll) → lenis.on('scroll', ScrollTrigger.update)
    → GSAP ScrollTrigger (scrub)
      → setFrame(index)        ← stored in sectionRef.current.setFrame
        → frameIndexRef.current = index; isDirtyRef.current = true
          → rAF loop: if dirty → getFrame() → ctx.drawImage() (cover-fit)
```

No React state is mutated on scroll. Frame index lives in a plain ref.

### Key modules

| File | Role |
|---|---|
| `src/config/sections.js` | Single source of truth: frameCount, pinDuration, basePath, scrub, textOverlays per section |
| `src/lib/imageSequenceEngine.js` | Pure JS: global Map-based frame cache, `createImageBitmap()` loading, progressive preload, `bitmap.close()` eviction |
| `src/hooks/useImageSequence.js` | React hook: DPR-aware canvas setup, dirty-flag rAF render loop, ResizeObserver, cover-fit drawImage |
| `src/lib/scrollOrchestrator.js` | Plain JS: Lenis + GSAP wiring, per-section ScrollTrigger instances, text animation timelines |
| `src/app/page.jsx` | Root: bootstrap sequence (preload → setIsReady → init scroll), section ref plumbing, cleanup ref |

### Section ref contract

Each section is a `forwardRef` that exposes via `useImperativeHandle`:
```js
{ el, setFrame, ...domRefs }  // e.g. eyebrowEl, headlineEl, fogEl
```
The scroll orchestrator reads these directly — no prop-drilling of frame indices.

### Critical invariants

- **`reactStrictMode: false`** in `next.config.js` — double-invocation in dev creates duplicate ScrollTrigger instances.
- **`ease: 'none'`** on every GSAP scrubbed animation — any easing causes drift vs. scroll position.
- **`pinSpacing: true`** on every pinned ScrollTrigger — without it, subsequent sections get wrong scroll offsets.
- **Lenis wiring order**: `lenis.on('scroll', ScrollTrigger.update)` → `gsap.ticker.add((t) => lenis.raf(t * 1000))` → `gsap.ticker.lagSmoothing(0)`. Any deviation causes scroll jitter.
- **`smoothWheel: true` in Lenis is required** — if set to false, Lenis stops managing `window.scrollY`, which breaks ScrollTrigger entirely (it reads `window.scrollY`). Never set it to false.
- **`wheelMultiplier: 0.6`** in Lenis config — slows scroll to 60% of normal speed for cinematic feel. Do not use custom wheel event interceptors (see Failed Attempts).
- **`orchestratorCleanupRef` in page.jsx** — cleanup from `initScrollOrchestrator` MUST be stored in a ref and called in the `useEffect` return. If `return cleanup` is placed inside the `setTimeout` callback it is returned to the callback (discarded), not to `useEffect`. Every HMR hot reload then creates a new Lenis instance without destroying the old one, eventually collapsing the site.
- **DPR cap at 2**: `Math.min(devicePixelRatio, 2)` — 3x is wasteful on mobile.
- **`drawImage` uses cover-fit math** — aspect ratio preserved, edges cropped (object-fit: cover). Uses 9-arg `drawImage(bitmap, sx, sy, sw, sh, 0, 0, w, h)`. Guard: only draw when `w > 0 && h > 0 && bitmap.width > 0 && bitmap.height > 0`, wrapped in try/catch so a single bad frame never kills the rAF loop.
- **Frame filenames are 1-based**: `String(index + 1).padStart(3, '0')` — code is always 0-based.
- **`bitmap.close()` on eviction** is mandatory — prevents GPU texture memory leak across 460+ frames.

### Image assets

All 4 sequence folders live in `public/` (required for Next.js static serving):
- `public/hero/` — 120 frames, `ezgif-frame-001.jpg` → `ezgif-frame-120.jpg`
- `public/play-area/`
- `public/swimming/`
- `public/sky-to-walking/`

Sequence frames bypass `next/image` entirely — they load via `fetch()` → `createImageBitmap()` directly.

### Text animation pattern (scrollOrchestrator.js)

All text uses: **blast in from y:120 → long hold → punch out to y:−120**. This is intentional and should not be reverted to fade/drift.

```js
// fly in: 0.00 – 0.14
tl.fromTo(el, { opacity: 0, y: 120 }, { opacity: 1, y: 0, duration: 0.14, ease: 'none' })
// hold: 0.14 – 0.68 (implicit — no tween needed)
// punch out: 0.68 – 0.82
tl.to(el, { opacity: 0, y: -120, duration: 0.14, ease: 'none' }, 0.68)
```

`ease: 'none'` is mandatory on ALL scrubbed animations. The hold window (0.14–0.68) gives the user ~3+ scroll steps to read the text before it exits.

### Typography

- Headlines/display: Cormorant Garamond, **weight 600** (bold)
- Microcopy words: Jost, **weight 600**, `clamp(1.4rem, 3.5vw, 2.8rem)`
- Eyebrow labels: Jost, weight 300, uppercase
- Body/footer: DM Sans, weight 300

### Project content (Level UP)

- **Project name**: Level UP by Space Link
- **Location**: Khajaguda & Puppalaguda, Manilonda, Hyderabad
- **Nearby**: Delhi Public School, Oakridge International School, ORR, Lanco Hills
- **Sizes**: 2365 – 3105 sft
- **Facings**: East & West
- **Price**: From ₹2.3 Cr*

---

## Known Issues & Failed Attempts

### OneDrive webpack cache conflict

**Problem**: Project lives in `OneDrive/Documents/`. Webpack atomically renames `.pack.gz_` → `.pack.gz` to save cache. OneDrive locks the file during sync, causing the rename to fail.

**Symptom**: Console warning `[webpack.cache.PackFileCacheStrategy] Caching failed for pack`. Non-fatal — site builds and runs correctly.

**Wrong fix**: Deleting `.next/` makes it worse (forces cold rebuild on OneDrive).

**Right fix**: Move project to a non-OneDrive path (e.g. `C:/dev/space_link_scrolly`) or pause OneDrive sync during dev.

### `smoothWheel: false` breaks everything

**Attempted**: Setting `smoothWheel: false` in Lenis to take over wheel events manually.

**Result**: Lenis stops managing `window.scrollY`. ScrollTrigger reads `window.scrollY` — it never updates — sections never pin — canvases never advance. Site appears to load but is completely unscrollable and canvas stays black.

**Lesson**: Never set `smoothWheel: false`. Lenis must own `window.scrollY` for ScrollTrigger to work.

### Custom wheel interceptor with `stopImmediatePropagation`

**Attempted**: `window.addEventListener('wheel', onWheel, { capture: true })` with `e.stopImmediatePropagation()` to normalize each tick to a fixed pixel step, then call `lenis.scrollTo(targetY)`.

**Result**: Fragile under HMR. Combined with the cleanup bug (see below), each hot reload created a new interceptor without removing the old one. Multiple interceptors fight each other and Lenis can't determine its own scroll position correctly.

**Lesson**: Do not use custom wheel interceptors with Lenis. Use `wheelMultiplier` to control scroll speed.

### `pinDuration` values too large

**Attempted**: Increased pinDuration from 250–300vh to 350–500vh to slow down scroll.

**Result**: GSAP ScrollTrigger layout calculation breaks. Sections overlap or render at wrong scroll positions. Images appear cut off because subsequent sections' pin start positions are calculated incorrectly.

**Lesson**: pinDuration controls how much total page height is consumed per section. Current working values: hero 280vh, play-area 250vh, swimming 260vh, sky-walking 340vh. Change carefully.

### Cleanup bug in page.jsx (`return cleanup` inside setTimeout)

**Bug**: The original code had:
```js
const timer = setTimeout(() => {
  const cleanup = initScrollOrchestrator(sectionRefs, footerRef)
  return cleanup  // ← returned to setTimeout callback, discarded
}, 100)
return () => clearTimeout(timer)  // ← never calls cleanup()
```

**Result**: Every HMR reload created a new Lenis + ScrollTrigger instance without destroying the old ones. After 3–4 code saves, there were 4+ Lenis instances all fighting — scroll broke, images stopped updating, site collapsed.

**Fix**: Store cleanup in `orchestratorCleanupRef` (a `useRef`) and call it from the `useEffect` return:
```js
const orchestratorCleanupRef = useRef(null)
// in useEffect:
orchestratorCleanupRef.current = initScrollOrchestrator(sectionRefs, footerRef)
return () => {
  clearTimeout(timer)
  if (orchestratorCleanupRef.current) {
    orchestratorCleanupRef.current()
    orchestratorCleanupRef.current = null
  }
}
```

### `drawImage` without cover-fit causes image stretch/cutoff

**Original**: `ctx.drawImage(bitmap, 0, 0, w, h)` — stretches bitmap to fill canvas, ignoring aspect ratio.

**Fix**: 9-argument cover-fit version:
```js
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
ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, w, h)
```

Guard: if `w === 0` or `h === 0`, `canvasAR = NaN`, causing `drawImage` to throw a DOMException that kills the rAF loop permanently. Always check `w > 0 && h > 0` before drawing.

### Adding a new section

1. Add config entry to `src/config/sections.js`
2. Create `src/components/sections/YourSection.jsx` following the `forwardRef` + `useImperativeHandle` pattern
3. Add frame + text ScrollTrigger blocks in `src/lib/scrollOrchestrator.js`
4. Wire ref, `onSetFrame` callback, and `handleXSetFrame` in `src/app/page.jsx`
