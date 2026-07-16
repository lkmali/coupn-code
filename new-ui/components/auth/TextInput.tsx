'use client'

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: ReactNode
  helperText?: string
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, icon, helperText, className, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* Label */}
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-secondary transition-colors duration-200"
          style={{ color: isFocused ? '#F4C542' : undefined }}
        >
          {label}
        </label>

        {/* Input wrapper */}
        <div className="relative group">
          {/* Left icon */}
          {icon && (
            <div
              className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 transition-colors duration-250"
              aria-hidden="true"
              style={{ color: isFocused ? '#F4C542' : '#505050' }}
            >
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-label={label}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className={cn(
              'auth-input w-full rounded-xl h-12 sm:h-[52px]',
              'text-[15px] font-medium',
              'transition-all duration-250',
              icon ? 'pl-11 pr-4' : 'px-4',
              error
                ? 'border-error/70 focus:border-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
                : '',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />

          {/* Focus glow ring (animated) */}
          <AnimatePresence>
            {isFocused && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{
                  boxShadow: '0 0 0 2.5px rgba(244,197,66,0.35), 0 0 18px rgba(244,197,66,0.08)',
                }}
                aria-hidden="true"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Error message */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              id={`${inputId}-error`}
              role="alert"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex items-center gap-1.5 text-xs font-medium text-error"
            >
              <AlertCircle size={13} className="shrink-0" aria-hidden="true" />
              {error}
            </motion.p>
          ) : helperText ? (
            <motion.p
              key="helper"
              id={`${inputId}-helper`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-text-secondary/70"
            >
              {helperText}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    )
  }
)

TextInput.displayName = 'TextInput'
