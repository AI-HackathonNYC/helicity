import { useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { usePolling } from '../hooks/usePolling'
import { fetchStressScore } from '../lib/api'
import { DataSourceBadge } from './DataSourceBadge'
import { NarrativeCard } from './NarrativeCard'
import { TrustBadge } from './TrustBadge'
import type { StressScore } from '../lib/types'

function scoreColor(score: number): string {
  if (score <= 25) return '#00b894'
  if (score <= 50) return '#e17055'
  if (score <= 75) return '#e17055'
  return '#e84393'
}

export function StressScoreDetail() {
  const { symbol } = useParams<{ symbol: string }>()
  const fetcher = useCallback(() => fetchStressScore(symbol || ''), [symbol])
  const { data: score, loading, error } = usePolling<StressScore>(fetcher, 60000)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-48 bg-[#f3f2f7] rounded-xl" />
        <div className="animate-pulse h-64 bg-[#f3f2f7] rounded-xl" />
      </div>
    )
  }

  if (error || !score) {
    return (
      <div className="bg-white rounded-xl border border-black/6 p-8 text-center">
        <p className="text-[#e84393] font-medium mb-2">Failed to load {symbol}</p>
        <p className="text-sm text-[#888]">{error}</p>
        <Link to="/" className="text-sm text-[#6c5ce7] hover:underline mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const dimChartData = score.dimensions.map(d => ({
    name: d.name.replace(/\s*\(.*\)/, ''),
    score: d.score,
    weighted: d.weighted_score,
    weight: `${(d.weight * 100).toFixed(0)}%`,
  }))

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/" className="text-sm text-[#6c5ce7] hover:underline">
        Back to Dashboard
      </Link>

      {/* Hero score card */}
      <div className="bg-white rounded-xl border border-black/6 p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#0f0f0f]">{score.stablecoin}</h2>
            <p className="text-sm text-[#888] mt-1">Liquidity Stress Score</p>
          </div>
          <DataSourceBadge source={score.resolution_source} />
        </div>
        <div className="grid grid-cols-3 gap-8">
          <div>
            <div className="text-5xl font-bold" style={{ color: scoreColor(score.stress_score) }}>
              {score.stress_score}
            </div>
            <p className="text-xs text-[#888] mt-2 uppercase tracking-wider">{score.stress_level}</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0f0f0f]">{score.redemption_latency_hours}</div>
            <p className="text-xs text-[#888] mt-2 uppercase tracking-wider">Redemption Latency</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0f0f0f]">{score.liquidity_coverage_ratio}</div>
            <p className="text-xs text-[#888] mt-2 uppercase tracking-wider">Liquidity Coverage</p>
          </div>
        </div>
      </div>

      {/* 6-Dimension Breakdown */}
      <div className="bg-white rounded-xl border border-black/6 p-6">
        <h3 className="text-sm font-semibold text-[#0f0f0f] uppercase tracking-wider mb-4">
          6-Dimension Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dimChartData} layout="vertical" margin={{ left: 140 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f2f7" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#888' }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#555' }} width={130} />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}`,
                name === 'weighted' ? 'Weighted Score' : 'Raw Score'
              ]}
              contentStyle={{ borderRadius: 8, border: '1px solid #eee' }}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={18}>
              {dimChartData.map((entry, i) => (
                <Cell key={i} fill={scoreColor(entry.score)} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {score.dimensions.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-[#888] px-2">
              <span>{d.name} ({(d.weight * 100).toFixed(0)}% weight)</span>
              <span className="text-[#555]">{d.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Consensus Panel */}
      {score.jury && (
        <div className="bg-white rounded-xl border border-black/6 p-6">
          <h3 className="text-sm font-semibold text-[#0f0f0f] uppercase tracking-wider mb-4">
            Model Consensus
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 text-sm">
              <span>Claude: <strong>{score.jury.claude_score.toFixed(0)}</strong></span>
              <span>Gemini: <strong>{score.jury.gemini_score.toFixed(0)}</strong></span>
              <span>Delta: <strong>{score.jury.delta.toFixed(0)}</strong></span>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${score.jury.consensus
                ? 'bg-[#00b894]/10 text-[#00b894]'
                : 'bg-[#e17055]/10 text-[#e17055]'
              }`}>
              {score.jury.consensus ? 'CONSENSUS' : 'DIVERGENCE'}
            </span>
          </div>
          {score.jury.warning && (
            <p className="text-xs text-[#e17055] mt-2">{score.jury.warning}</p>
          )}
        </div>
      )}

      {/* Narrative */}
      <NarrativeCard narrative={score.narrative} />

      {/* Trust & Verification */}
      <TrustBadge ipfsCid={score.ipfs_cid} jury={score.jury} />
    </div>
  )
}
