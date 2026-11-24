import type { ReactNode } from 'react'
import { CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/** Card header whose title is a real <h2> (page outline), with an optional note under it and an action on the right. */
export function CardHeading({ title, note, action }: { title: string; note?: string; action?: ReactNode }) {
  return (
    <CardHeader>
      <CardTitle>
        <h2>{title}</h2>
      </CardTitle>
      {note !== undefined && <CardDescription>{note}</CardDescription>}
      {action !== undefined && <CardAction>{action}</CardAction>}
    </CardHeader>
  )
}
