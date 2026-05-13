// sections.js — Single source of truth for all scroll sequence sections.
// Every section component and the scroll orchestrator read from here.

export const SECTIONS = [
  {
    id: 'hero',
    frameCount: 120,
    // pinDuration: how much scroll distance is consumed while section is pinned
    pinDuration: '280vh',
    // basePath: prepended to zero-padded frame number + ".jpg"
    basePath: 'https://sli-lg-jpegs.avlokai.com/hero/ezgif-frame-',
    transition: 'fade-in', // initial dark-to-content fade on page load
    // scrub: GSAP scrub lag in seconds. Lower = more responsive, higher = more cinematic
    scrub: 0.25,
    textOverlays: [
      {
        text: 'Crafted Spaces',
        role: 'eyebrow',
        // fadeStart/fadeEnd: scroll progress [0,1] window for this element
        fadeStart: 0.0,
        fadeEnd: 0.35,
      },
      {
        text: 'Designed Around Life',
        role: 'headline',
        fadeStart: 0.0,
        fadeEnd: 0.4,
      },
    ],
  },
  {
    id: 'play-area',
    frameCount: 120,
    pinDuration: '250vh',
    basePath: 'https://sli-lg-jpegs.avlokai.com/play-area/ezgif-frame-',
    transition: 'hard-cut',
    scrub: 0.25,
    textOverlays: [
      // triggerProgress: center of the visibility window for each microcopy word
      { text: 'Movement',  role: 'microcopy', triggerProgress: 0.2 },
      { text: 'Community', role: 'microcopy', triggerProgress: 0.55 },
      { text: 'Belonging', role: 'microcopy', triggerProgress: 0.85 },
    ],
  },
  {
    id: 'swimming',
    frameCount: 120,
    pinDuration: '260vh',
    basePath: 'https://sli-lg-jpegs.avlokai.com/swimming/ezgif-frame-',
    transition: 'gradient-wipe',
    scrub: 0.25,
    textOverlays: [
      // role: 'headline-wordbyword' → split into spans, staggered opacity reveal
      { text: 'Where Architecture Breathes', role: 'headline-wordbyword' },
    ],
  },
  {
    id: 'sky-walking',
    frameCount: 120,
    pinDuration: '340vh',
    basePath: 'https://sli-lg-jpegs.avlokai.com/sky-to-walking/ezgif-frame-',
    transition: 'fade',
    // Uniform scrub across sections — was 0.8, caused visible lag/stutter
    scrub: 0.25,
    textOverlays: [
      { text: 'Every Path', role: 'headline', fadeStart: 0.1, fadeEnd: 0.45 },
      { text: 'Leads Home', role: 'headline', fadeStart: 0.5,  fadeEnd: 0.9 },
    ],
  },
]

// On mobile (< 768px): only load every Nth frame to halve memory and network usage.
// Frame getter snaps requested index to nearest multiple of this value.
export const MOBILE_FRAME_DENSITY = 2

// How many frame images to preload immediately before the site becomes interactive.
// Remaining frames load in background batches.
export const EAGER_FRAME_COUNT = 40

// Background preload batch size — smaller = more responsive main thread
export const PRELOAD_BATCH_SIZE = 10
