import { Link } from 'react-router'
import { useT } from '@/hooks/prefs'

export default function NotFoundPage() {
  const t = useT()
  return (
    <div className="space-y-3 py-12 text-center">
      <p className="text-lg">{t('notFound')}</p>
      <Link to="/" className="underline underline-offset-2">
        {t('backHome')}
      </Link>
    </div>
  )
}
