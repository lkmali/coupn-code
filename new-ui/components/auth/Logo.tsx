'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  linkTo?: string
  animated?: boolean
}

const sizeMap = {
  sm: { icon: 28, text: 'text-lg', gap: 'gap-2' },
  md: { icon: 38, text: 'text-2xl', gap: 'gap-2.5' },
  lg: { icon: 48, text: 'text-3xl', gap: 'gap-3' },
}

function LogoIcon({ size = 38 }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer hexagon frame */}
      <polygon
        points="24,2 44,13 44,35 24,46 4,35 4,13"
        stroke="url(#hexGrad)"
        strokeWidth="1.5"
        fill="rgba(244,197,66,0.06)"
      />

      {/* Inner hexagon */}
      <polygon
        points="24,8 39,16.5 39,31.5 24,40 9,31.5 9,16.5"
        fill="rgba(244,197,66,0.04)"
        stroke="url(#hexGrad)"
        strokeWidth="0.8"
        strokeOpacity="0.5"
      />

      {/* Controller / A shape */}
      <path
        d="M24 14 L32 28 H16 Z"
        fill="url(#triGrad)"
        opacity="0.9"
      />

      {/* Center dot */}
      <circle cx="24" cy="22" r="2.5" fill="#0B0B0D" />

      {/* Top dot accent */}
      <circle cx="24" cy="12" r="1.5" fill="#F4C542" opacity="0.7" />

      {/* Corner dots */}
      <circle cx="14" cy="30" r="1" fill="#F4C542" opacity="0.5" />
      <circle cx="34" cy="30" r="1" fill="#F4C542" opacity="0.5" />

      <defs>
        <linearGradient id="hexGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F4C542" />
          <stop offset="1" stopColor="#D89F00" />
        </linearGradient>
        <linearGradient id="triGrad" x1="16" y1="14" x2="32" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F4C542" />
          <stop offset="1" stopColor="#D89F00" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function LogoContent({ size = 'md' }: { size: 'sm' | 'md' | 'lg' }) {
  const { icon, text, gap } = sizeMap[size]

  return (
    <div className={`flex items-center ${gap}`}>
      <LogoIcon size={icon} />
      <span
        className={`font-display font-800 tracking-wider ${text} text-gold-shimmer select-none`}
        style={{
          fontFamily: 'var(--font-outfit), Outfit, sans-serif',
          fontWeight: 800,
          letterSpacing: '0.12em',
          background: 'linear-gradient(135deg, #F4C542 0%, #D89F00 60%, #F4C542 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundSize: '200% auto',
        }}
      >
        ARENAX
      </span>
    </div>
  )
}

export function Logo({ size = 'md', linkTo, animated = true }: LogoProps) {
  const content = <LogoContent size={size} />

  const wrapper = linkTo ? (
    <Link
      href={linkTo}
      className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-primary rounded-lg"
      aria-label="ArenaX — Go to homepage"
    >
      {content}
    </Link>
  ) : (
    <div className="inline-flex items-center">{content}</div>
  )

  if (!animated) return wrapper

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {wrapper}
    </motion.div>
  )
}
