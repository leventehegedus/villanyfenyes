import type { ReactNode } from 'react'
import { SeasonLeaguePicker } from '@/components/SeasonLeaguePicker'

/** Page title with the season/league picker on the right. */
export function PageHeader({ title, picker = true, children }: { title: string; picker?: boolean; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
        {children}
      </div>
      {picker && <SeasonLeaguePicker />}
    </div>
  )
}
