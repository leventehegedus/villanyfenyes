import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/** Card header whose title is a real <h2> (page outline), with an optional note under it. */
export function CardHeading({ title, note }: { title: string; note?: string }) {
  return (
    <CardHeader>
      <CardTitle>
        <h2>{title}</h2>
      </CardTitle>
      {note !== undefined && <CardDescription>{note}</CardDescription>}
    </CardHeader>
  )
}
