"use client";

/**
 * Dashboard — greets the user and shows the details saved for this device.
 * Editing happens through the profile menu in the top-right.
 */

import { useAppSelector } from "@/store/hooks";
import { selectUser } from "@/features/user/userSelectors";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-zinc-100 py-4 last:border-b-0">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="truncate text-sm font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAppSelector(selectUser);

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Welcome back, {user.userName.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your details are saved on this device.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-2">
        <dl>
          <Row label="Full name" value={user.userName} />
          <Row label="Phone number" value={user.mobileNumber} />
          <Row label="UPI ID" value={user.upiId} />
        </dl>
      </div>

      <p className="text-sm text-zinc-500">
        Need to change something? Use the profile menu in the top-right corner.
      </p>
    </div>
  );
}
