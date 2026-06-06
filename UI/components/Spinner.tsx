/** Simple centered loading spinner (class-only styling). */
export default function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-500">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
