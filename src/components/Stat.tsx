import type { ReactNode } from 'react'

/** Label/value tile; missing values render the localised "no data". */
export function Stat({ label, value, missing }: { label: string; value: ReactNode | null; missing: string }) {
  const long = typeof value === 'string' && value.length > 8
  return (
    <div className="rounded-lg border bg-card p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={long ? 'mt-0.5 text-sm font-semibold' : 'tabular mt-0.5 text-lg font-semibold'}>{value ?? <span className="text-sm font-normal text-muted-foreground">{missing}</span>}</dd>
    </div>
  )
}
