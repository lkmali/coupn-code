'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  isLoading?: boolean
  loadingText?: string
  fullWidth?: boolean
}

export function PrimaryButton({
  children,
  isLoading = false,
  loadingText = 'Please wait...',
  fullWidth = true,
  className,
  disabled,
  ...props
}: PrimaryButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.012, y: -1 } : {}}
      whileTap={!isDisabled ? { scale: 0.985, y: 0 } : {}}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      // Pass native button props through the motion component
      {...(props as Record<string, unknown>)}
      disabled={isDisabled}
      className={cn(
        'btn-gold',
        'relative h-12 sm:h-[52px] px-6 rounded-xl',
        'text-[15px] font-bold tracking-wide',
        'flex items-center justify-center gap-2',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'select-none cursor-pointer',
        fullWidth ? 'w-full' : '',
        isDisabled ? 'pointer-events-none' : '',
        className
      )}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
    >
      {/* Shimmer overlay on hover */}
      {!isDisabled && (
        <span
          className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden"
          aria-hidden="true"
        >
          <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
        </span>
      )}

      {isLoading ? (
        <>
          <Loader2 size={18} className="animate-spin shrink-0" aria-hidden="true" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  )
}
