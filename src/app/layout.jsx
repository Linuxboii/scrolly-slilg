// layout.jsx — Root layout. Handles font loading and html/body wrappers.
// Google Fonts loaded via next/font: automatic subsetting, no layout shift,
// exposed as CSS variables for use throughout globals.css.

import { Cormorant_Garamond, Jost, DM_Sans } from 'next/font/google'
import './globals.css'

// High-contrast serif — luxury real estate standard
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

// Clean geometric sans for labels and microcopy
const jost = Jost({
  subsets: ['latin'],
  weight: ['200', '300', '400'],
  variable: '--font-jost',
  display: 'swap',
})

// Neutral workhorse for body text / footer
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata = {
  title: 'Designed Around Life',
  description: 'Where architecture breathes.',
  openGraph: {
    title: 'Designed Around Life',
    description: 'Crafted spaces. Cinematic living.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jost.variable} ${dmSans.variable}`}
    >
      {/*
        No scroll-behavior: smooth — Lenis owns scrolling entirely.
        Background on html prevents white flash before JS loads.
      */}
      <body>{children}</body>
    </html>
  )
}
