import type { ReactNode } from 'react'
import { SeasonLeaguePicker } from '@/components/SeasonLeaguePicker'

/** Page title with the season/league picker (or only the season one) on the right. */
export function PageHeader({ title, picker = true, children }: { title: string; picker?: boolean | 'season'; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-heading text-3xl leading-none font-bold md:text-5xl">{title}</h1>
        {children}
      </div>
      {picker && <SeasonLeaguePicker seasonOnly={picker === 'season'} />}
    </div>
  )
}
