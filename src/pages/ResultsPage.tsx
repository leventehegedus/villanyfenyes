import { MatchesView } from '@/components/MatchesView'

export default function ResultsPage() {
  return <MatchesView title="navResults" defaultStatus="played" showStatus={false} newestFirst />
}
