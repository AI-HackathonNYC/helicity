import { AlertBanner } from '../components/AlertBanner'
import { StressScoreTable } from '../components/StressScoreTable'
import { RiskModeling } from '../components/RiskModeling'
import { ReserveMap } from '../components/ReserveMap'
import type { StressScore } from '../lib/types'

interface Props {
  scores: StressScore[] | null
  loading: boolean
}

export function DashboardPage({ scores, loading }: Props) {
  return (
    <div className="space-y-6">
      <AlertBanner />
      <StressScoreTable scores={scores || []} loading={loading} />
      <RiskModeling scores={scores} />
      <ReserveMap />
    </div>
  )
}
