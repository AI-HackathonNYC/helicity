import { useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import { usePolling } from './hooks/usePolling'
import { fetchStressScores } from './lib/api'
import { DashboardLayout } from './layouts/DashboardLayout'
import { DashboardPage } from './pages/DashboardPage'
import { MapPage } from './pages/MapPage'
import { DeveloperPortalPage } from './pages/DeveloperPortalPage'
import { StressScoreDetail } from './components/StressScoreDetail'
import type { StressScore } from './lib/types'

export default function App() {
  const fetcher = useCallback(() => fetchStressScores(), [])
  const { data: scores, loading, lastUpdated } = usePolling<StressScore[]>(fetcher, 60000)

  return (
    <Routes>
      <Route element={<DashboardLayout lastUpdated={lastUpdated} />}>
        <Route path="/" element={<DashboardPage scores={scores} loading={loading} />} />
        <Route path="/stablecoin/:symbol" element={<StressScoreDetail />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/developers" element={<DeveloperPortalPage />} />
      </Route>
    </Routes>
  )
}
