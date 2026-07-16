'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Wallet } from 'lucide-react'

import type { UserDetailsFormData } from '@/lib/validations'
import { UserDetailsForm } from './UserDetailsForm'

interface UserDetailsModalProps {
  onSubmit: (data: UserDetailsFormData) => Promise<void>
}

/**
 * First-visit popup. Deliberately not dismissible — there is no Escape handler
 * and no backdrop click, because the details are required before the app is
 * usable. Shown only when the server doesn't recognise this device.
 */
export function UserDetailsModal({ onSubmit }: UserDetailsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Hold focus inside the dialog: it's the only thing on screen that matters,
  // and tabbing to the page behind it would be a dead end.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input, button, [href], select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      previouslyFocused?.focus()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-hidden="true"
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-details-title"
        aria-describedby="user-details-description"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card relative w-full max-w-[420px] rounded-2xl px-6 py-8 sm:px-8 sm:py-10 max-h-[90vh] overflow-y-auto"
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-24 rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #F4C542, transparent)' }}
          aria-hidden="true"
        />

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: 'rgba(244,197,66,0.1)', border: '1px solid rgba(244,197,66,0.25)' }}
              aria-hidden="true"
            >
              <Wallet size={24} style={{ color: '#F4C542' }} />
            </div>
          </div>

          <h1
            id="user-details-title"
            className="font-display text-2xl sm:text-[26px] font-bold text-white mb-2"
            style={{ fontFamily: 'var(--font-outfit)' }}
          >
            Complete Your Details
          </h1>
          <p id="user-details-description" className="text-text-secondary text-sm sm:text-[15px]">
            We need a few details before you get started. This is a one-time step for this device.
          </p>
        </div>

        <UserDetailsForm submitLabel={<span>Save Details</span>} loadingText="Saving..." onSubmit={onSubmit} />
      </motion.div>
    </div>
  )
}
