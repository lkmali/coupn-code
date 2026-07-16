'use client'

import { motion } from 'framer-motion'

interface AuthLayoutProps {
  children: React.ReactNode
}

/**
 * NOTE: reconstructed. Full-height centred shell with the ambient gold glow the
 * cards sit on. The original was lost; this matches the palette but not
 * necessarily the exact original composition.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* Ambient background wash */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(244,197,66,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 50% 110%, rgba(216,159,0,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Faint grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 0%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 0%, transparent 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex w-full flex-col items-center"
      >
        {children}
      </motion.div>
    </main>
  )
}
