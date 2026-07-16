'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.1,
      }}
      className={cn(
        'relative w-full max-w-[420px] mx-auto',
        'glass-card rounded-2xl',
        'px-6 py-8 sm:px-8 sm:py-10',
        className
      )}
    >
      {/* Top gold accent line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-24 rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent, #F4C542, transparent)',
        }}
        aria-hidden="true"
      />

      {/* Subtle inner glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(244,197,66,0.06) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {children}
    </motion.div>
  )
}
