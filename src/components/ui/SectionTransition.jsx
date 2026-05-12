'use client'

// SectionTransition.jsx — Dark gradient overlay that sits between sections.
// Used for the "gradient-wipe" transition type (entering Swimming section).
// The scroll orchestrator animates its opacity via a ScrollTrigger on the
// exiting section's final frames.

import { forwardRef } from 'react'

const SectionTransition = forwardRef(function SectionTransition({ type = 'gradient-wipe' }, ref) {
  if (type === 'gradient-wipe') {
    return (
      <div
        ref={ref}
        className="gradient-wipe"
        aria-hidden="true"
        role="presentation"
      />
    )
  }

  // 'fade' type — used for sky-walking → footer
  return (
    <div
      ref={ref}
      className="exit-overlay"
      aria-hidden="true"
      role="presentation"
    />
  )
})

export default SectionTransition
