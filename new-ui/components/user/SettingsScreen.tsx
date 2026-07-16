'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { AuthCard, AuthLayout, Logo } from '@/components/auth'
import { UserDetailsForm } from './UserDetailsForm'
import { fetchUserForDevice, updateUserDetails, type SavedUser } from '@/lib/api'
import type { UserDetailsFormData } from '@/lib/validations'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; user: SavedUser }
  | { status: 'empty' }
  | { status: 'error'; message: string }

export function SettingsScreen() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const user = await fetchUserForDevice()
      setState(user ? { status: 'ready', user } : { status: 'empty' })
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
    const user = await updateUserDetails(data)
    setState({ status: 'ready', user })
    setSavedAt(Date.now())
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <Logo size="md" animated linkTo="/" />
      </div>

      <AuthCard>
        <div className="text-center mb-8">
          <h1
            className="font-display text-2xl sm:text-[26px] font-bold text-white mb-2"
            style={{ fontFamily: 'var(--font-outfit)' }}
          >
            Your Details
          </h1>
          <p className="text-text-secondary text-sm sm:text-[15px]">Update the information saved for this device.</p>
        </div>

        {state.status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-6" role="status" aria-live="polite">
            <Loader2 size={26} className="animate-spin" style={{ color: '#F4C542' }} aria-hidden="true" />
            <p className="text-text-secondary text-sm">Loading...</p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center" role="alert">
            <AlertCircle size={36} className="text-error" aria-hidden="true" />
            <p className="text-text-secondary text-sm">{state.message}</p>
            <button
              onClick={() => void load()}
              className="font-semibold text-sm hover:underline underline-offset-2"
              style={{ color: '#F4C542' }}
            >
              Try again
            </button>
          </div>
        )}

        {state.status === 'empty' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <p className="text-text-secondary text-sm">
              This device has no details saved yet. Add them from the home page first.
            </p>
            <Link
              href="/"
              className="font-semibold text-sm hover:underline underline-offset-2"
              style={{ color: '#F4C542' }}
            >
              Go to Home →
            </Link>
          </div>
        )}

        {state.status === 'ready' && (
          <>
            {savedAt !== null && (
              <motion.p
                key={savedAt}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="status"
                className="mb-4 flex items-center justify-center gap-1.5 text-xs font-medium text-success"
              >
                <CheckCircle2 size={14} className="shrink-0" aria-hidden="true" />
                Details updated successfully
              </motion.p>
            )}

            <UserDetailsForm
              // Remount when the saved record changes so the inputs pick up the
              // server-normalised values (e.g. "+91 98765 43210" -> "9876543210").
              key={`${state.user.userId}-${state.user.mobileNumber}`}
              defaultValues={{
                userName: state.user.userName,
                mobileNumber: state.user.mobileNumber,
                upiId: state.user.upiId,
              }}
              submitLabel={<span>Save Changes</span>}
              loadingText="Saving..."
              onSubmit={handleSubmit}
            />
          </>
        )}

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-text-secondary hover:text-white transition-colors"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to Home
        </Link>
      </AuthCard>
    </AuthLayout>
  )
}
