'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Loader2, Phone, Settings, User, Wallet } from 'lucide-react'
import Link from 'next/link'

import { AuthLayout, Logo } from '@/components/auth'
import { UserDetailsModal } from './UserDetailsModal'
import { fetchUserForDevice, saveUserDetails, type SavedUser } from '@/lib/api'
import type { UserDetailsFormData } from '@/lib/validations'

type LoadState =
  | { status: 'loading' }
  | { status: 'needsDetails' }
  | { status: 'ready'; user: SavedUser }
  | { status: 'error'; message: string }

/**
 * Decides, on load, whether this device already has details on file.
 *
 * The device is identified by a localStorage machine id (with a fingerprint
 * fallback), never by IP — an IP changes on every network hop and would
 * re-prompt returning users.
 */
export function HomeScreen() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const user = await fetchUserForDevice()
      setState(user ? { status: 'ready', user } : { status: 'needsDetails' })
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to reach the server.',
      })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSubmit = async (data: UserDetailsFormData) => {
    const user = await saveUserDetails(data)
    setState({ status: 'ready', user })
  }

  if (state.status === 'loading') {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
          <Loader2 size={28} className="animate-spin" style={{ color: '#F4C542' }} aria-hidden="true" />
          <p className="text-text-secondary text-sm">Loading your details...</p>
        </div>
      </AuthLayout>
    )
  }

  if (state.status === 'error') {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 text-center" role="alert">
          <AlertCircle size={40} className="text-error" aria-hidden="true" />
          <p className="text-text-secondary text-sm max-w-[320px]">{state.message}</p>
          <button
            onClick={() => void load()}
            className="font-semibold text-sm transition-colors hover:underline underline-offset-2"
            style={{ color: '#F4C542' }}
          >
            Try again
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <Logo size="md" animated />
      </div>

      {state.status === 'needsDetails' && <UserDetailsModal onSubmit={handleSubmit} />}

      {state.status === 'ready' && <WelcomeCard user={state.user} />}
    </AuthLayout>
  )
}

function WelcomeCard({ user }: { user: SavedUser }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="glass-card relative w-full max-w-[420px] mx-auto rounded-2xl px-6 py-8 sm:px-8 sm:py-10"
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-24 rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent, #F4C542, transparent)' }}
        aria-hidden="true"
      />

      <div className="text-center mb-7">
        <h1
          className="font-display text-2xl sm:text-[26px] font-bold text-white mb-2"
          style={{ fontFamily: 'var(--font-outfit)' }}
        >
          Welcome back, {user.userName.split(' ')[0]}
        </h1>
        <p className="text-text-secondary text-sm">Your details are saved on this device.</p>
      </div>

      <dl className="flex flex-col gap-3">
        <DetailRow icon={<User size={16} />} label="Full Name" value={user.userName} />
        <DetailRow icon={<Phone size={16} />} label="Phone Number" value={user.mobileNumber} />
        <DetailRow icon={<Wallet size={16} />} label="UPI ID" value={user.upiId} />
      </dl>

      <Link
        href="/settings"
        className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold transition-colors hover:underline underline-offset-2"
        style={{ color: '#F4C542' }}
      >
        <Settings size={15} aria-hidden="true" />
        Update details
      </Link>
    </motion.div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3">
      <span style={{ color: '#505050' }} aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-wide text-text-secondary/60">{label}</dt>
        <dd className="text-[15px] font-medium text-white truncate">{value}</dd>
      </div>
    </div>
  )
}
