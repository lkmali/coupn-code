'use client'

import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Phone, User, Wallet } from 'lucide-react'

import { userDetailsSchema, type UserDetailsFormData } from '@/lib/validations'
import { FormField, PrimaryButton, TextInput } from '@/components/auth'

interface UserDetailsFormProps {
  defaultValues?: Partial<UserDetailsFormData>
  submitLabel: ReactNode
  loadingText: string
  onSubmit: (data: UserDetailsFormData) => Promise<void>
}

/**
 * The three fields we collect, shared by the first-visit popup and the settings
 * page. Validation is pattern-only by design: we check the shape of what was
 * typed, not that the number or UPI handle actually exists.
 */
export function UserDetailsForm({ defaultValues, submitLabel, loadingText, onSubmit }: UserDetailsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<UserDetailsFormData>({
    resolver: zodResolver(userDetailsSchema),
    mode: 'onChange',
    defaultValues,
  })

  const submit = async (data: UserDetailsFormData) => {
    setIsLoading(true)
    setSubmitError(null)
    try {
      await onSubmit(data)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <FormField index={0}>
        <TextInput
          label="Full Name"
          id="userName"
          type="text"
          placeholder="Enter your full name"
          autoComplete="name"
          icon={<User size={17} />}
          error={errors.userName?.message}
          {...register('userName')}
        />
      </FormField>

      <FormField index={1}>
        <TextInput
          label="Phone Number"
          id="mobileNumber"
          type="tel"
          placeholder="+91 98765 43210"
          autoComplete="tel"
          inputMode="tel"
          icon={<Phone size={17} />}
          error={errors.mobileNumber?.message}
          {...register('mobileNumber')}
        />
      </FormField>

      <FormField index={2}>
        <TextInput
          label="UPI ID"
          id="upiId"
          type="text"
          placeholder="yourname@upi"
          autoComplete="off"
          inputMode="email"
          icon={<Wallet size={17} />}
          error={errors.upiId?.message}
          {...register('upiId')}
        />
      </FormField>

      {submitError && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-error">
          <AlertCircle size={13} className="shrink-0" aria-hidden="true" />
          {submitError}
        </p>
      )}

      <FormField index={3}>
        <div className="mt-2">
          <PrimaryButton type="submit" disabled={!isValid} isLoading={isLoading} loadingText={loadingText}>
            {submitLabel}
          </PrimaryButton>
        </div>
      </FormField>
    </form>
  )
}
