'use client'

// Footer.jsx — Emerges from the final section via blur+opacity reveal.
// GSAP drives the reveal from scrollOrchestrator. The footer starts at
// filter: blur(16px), opacity: 0 (set in globals.css) and transitions to
// blur(0), opacity: 1 as the sky-walking section exits.

import { forwardRef } from 'react'

const Footer = forwardRef(function Footer(_, ref) {
  return (
    <footer ref={ref} className="site-footer">
      <div className="footer-inner">

        {/* Brand column */}
        <div className="footer-brand">
          <span className="footer-wordmark">Level&nbsp;UP</span>
          <span className="footer-tagline">by Space Link</span>
          <p className="footer-descriptor">
            Crafted spaces designed around life — in the heart of Manilonda.
          </p>
        </div>

        {/* Location column */}
        <div className="footer-location">
          <span className="footer-section-label">Location</span>
          <address className="footer-address" style={{ fontStyle: 'normal' }}>
            Khajaguda &amp; Puppalaguda<br />
            Manilonda, Hyderabad
          </address>
          <div className="footer-landmarks">
            <span className="footer-section-label" style={{ marginTop: '1rem', display: 'block' }}>Nearby</span>
            <ul className="footer-landmark-list">
              <li>Delhi Public School</li>
              <li>Oakridge International School</li>
              <li>Outer Ring Road (ORR)</li>
              <li>Lanco Hills</li>
            </ul>
          </div>
        </div>

        {/* Specs column */}
        <div className="footer-specs">
          <span className="footer-section-label">Project Details</span>
          <dl className="footer-spec-list">
            <div className="footer-spec-row">
              <dt>Sizes</dt>
              <dd>2365 – 3105 sft</dd>
            </div>
            <div className="footer-spec-row">
              <dt>Facings</dt>
              <dd>East &amp; West</dd>
            </div>
            <div className="footer-spec-row footer-spec-price">
              <dt>Starting From</dt>
              <dd>₹2.3 Cr <sup>*</sup></dd>
            </div>
          </dl>
          <p className="footer-disclaimer">
            * Prices are indicative and subject to change. Terms &amp; conditions apply.
          </p>
          <p className="footer-copy">
            &copy; {new Date().getFullYear()} Space Link. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  )
})

export default Footer
