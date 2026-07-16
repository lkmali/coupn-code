'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface FormFieldProps {
  children: ReactNode
  index?: number
}

/**
 * Wraps a form input in a staggered fade-in animation for elegant form entrance.
 */
export function FormField({ children, index = 0 }: FormFieldProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.45,
        delay: 0.3 + index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  )
}
