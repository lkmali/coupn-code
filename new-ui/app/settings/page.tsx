import type { Metadata } from 'next'
import { SettingsScreen } from '@/components/user/SettingsScreen'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Update the name, phone number, and UPI ID saved for this device.',
}

export default function SettingsPage() {
  return <SettingsScreen />
}
