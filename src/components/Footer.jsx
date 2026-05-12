'use client'

// Footer.jsx — Emerges from the final section via blur+opacity reveal.
// GSAP drives the reveal from scrollOrchestrator. The footer starts at
// filter: blur(16px), opacity: 0 (set in globals.css) and transitions to
// blur(0), opacity: 1 as the sky-walking section exits.

import { forwardRef } from 'react'

const Footer = forwardRef(function Footer(_, ref) {
  return (
    <footer ref={ref} className="site-footer">

      {/* CTA — full-width before the data columns */}
      <div className="footer-cta">
        <div className="footer-cta-left">
          <span className="footer-section-label">Schedule a Visit</span>
          <p className="footer-cta-headline">Begin the<br />Conversation</p>
        </div>
        <div className="footer-cta-right">
          <a href="tel:+917337331900" className="footer-contact-link">+91 733 733 1900</a>
          <a href="mailto:kumar@spacelinkinfra.com" className="footer-contact-link">kumar@spacelinkinfra.com</a>
          <span className="footer-contact-note">Response within 24 hours</span>
        </div>
      </div>

      <div className="footer-inner">

        {/* Brand column */}
        <div className="footer-brand">
          <span className="footer-wordmark">Level&nbsp;UP</span>
          <span className="footer-tagline">by Space Link Infra</span>
          <p className="footer-descriptor">
            Specialised real estate advisory, leasing, and property management across Hyderabad.
          </p>
          <div className="footer-social">
            <a href="https://www.instagram.com/spacelink.properties/" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>
            </a>
            <a href="https://www.facebook.com/spacelinkinfra" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Facebook">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://www.linkedin.com/company/space-link-infra-consultants/" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="LinkedIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
            <a href="https://youtube.com/@spacelinkinfra" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="YouTube">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
            </a>
          </div>
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
