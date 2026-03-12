import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { projectScenario } from '../lib/api'
import type { ProjectionResult, StressScore } from '../lib/types'

interface Props {
  scores: StressScore[] | null
}

function scoreColor(score: number): string {
  if (score <= 25) return '#00b894'
  if (score <= 50) return '#e17055'
  if (score <= 75) return '#e17055'
  return '#e84393'
}

export function RiskModeling({ scores }: Props) {
  const [selectedCoin, setSelectedCoin] = useState('USDC')
  const [rateHike, setRateHike] = useState(0)
  const [hurricaneCat, setHurricaneCat] = useState(0) // 0 = off
  const [hurricaneTarget, setHurricaneTarget] = useState('florida') // preset regions
  const [bankFailure, setBankFailure] = useState('')
  const [projection, setProjection] = useState<ProjectionResult | null>(null)
  const [loading, setLoading] = useState(false)

  const hurricanePresets: Record<string, { lat: number; lng: number; label: string }> = {
    florida: { lat: 27.8, lng: -82.6, label: 'Florida Gulf Coast' },
    virginia: { lat: 38.9, lng: -77.4, label: 'Northern Virginia (us-east-1)' },
    northeast: { lat: 40.7, lng: -74.0, label: 'Northeast (NYC)' },
    gulf: { lat: 29.9, lng: -90.1, label: 'Gulf Coast (Louisiana)' },
  }

  const runProjection = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { stablecoin: selectedCoin }
      if (rateHike > 0) params.rate_hike_bps = rateHike
      if (hurricaneCat > 0) {
        const preset = hurricanePresets[hurricaneTarget]
        params.hurricane_lat = preset.lat
        params.hurricane_lng = preset.lng
        params.hurricane_category = hurricaneCat
      }
      if (bankFailure) params.bank_failure = bankFailure

      const res = await projectScenario(params as Parameters<typeof projectScenario>[0])
      setProjection(res.data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const symbols = scores?.map(s => s.stablecoin) || ['USDC', 'USDT']

  return (
    <div className="bg-white rounded-xl border border-black/6 overflow-hidden">
      <div className="px-6 py-4 border-b border-black/4">
        <h2 className="text-sm font-semibold text-[#0f0f0f] uppercase tracking-wider">
          Risk Modeling — Scenario Projections
        </h2>
        <p className="text-xs text-[#888] mt-1">
          Model how real-world events will impact reserve liquidity
        </p>
      </div>

      <div className="p-6">
        {/* Controls */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Stablecoin selector */}
          <div>
            <label className="block text-xs font-medium text-[#888] uppercase tracking-wider mb-1.5">
              Stablecoin
            </label>
            <select
              value={selectedCoin}
              onChange={e => setSelectedCoin(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white text-sm text-[#0f0f0f] focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/30"
            >
              {symbols.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Rate hike */}
          <div>
            <label className="block text-xs font-medium text-[#888] uppercase tracking-wider mb-1.5">
              Rate Change: {rateHike > 0 ? `+${rateHike}bps` : 'None'}
            </label>
            <input
              type="range"
              min={0}
              max={200}
              step={25}
              value={rateHike}
              onChange={e => setRateHike(Number(e.target.value))}
              className="w-full accent-[#6c5ce7]"
            />
          </div>

          {/* Hurricane forecast */}
          <div>
            <label className="block text-xs font-medium text-[#888] uppercase tracking-wider mb-1.5">
              Storm Forecast: {hurricaneCat > 0 ? `Cat ${hurricaneCat}` : 'None'}
            </label>
            <div className="flex gap-2">
              <select
                value={hurricaneTarget}
                onChange={e => setHurricaneTarget(e.target.value)}
                className="flex-1 px-2 py-2 rounded-lg border border-black/10 bg-white text-xs text-[#0f0f0f] focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/30"
              >
                {Object.entries(hurricanePresets).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <select
                value={hurricaneCat}
                onChange={e => setHurricaneCat(Number(e.target.value))}
                className="w-20 px-2 py-2 rounded-lg border border-black/10 bg-white text-xs text-[#0f0f0f] focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/30"
              >
                <option value={0}>Off</option>
                {[1, 2, 3, 4, 5].map(c => <option key={c} value={c}>Cat {c}</option>)}
              </select>
            </div>
          </div>

          {/* Bank failure */}
          <div>
            <label className="block text-xs font-medium text-[#888] uppercase tracking-wider mb-1.5">
              Bank Stress Event
            </label>
            <select
              value={bankFailure}
              onChange={e => setBankFailure(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white text-sm text-[#0f0f0f] focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/30"
            >
              <option value="">None</option>
              <option value="BNY Mellon">BNY Mellon</option>
              <option value="State Street">State Street</option>
              <option value="JPMorgan">JPMorgan Chase</option>
              <option value="Cantor">Cantor Fitzgerald</option>
            </select>
          </div>
        </div>

        {/* Run button */}
        <button
          onClick={runProjection}
          disabled={loading || (rateHike === 0 && hurricaneCat === 0 && !bankFailure)}
          className="px-5 py-2.5 rounded-lg bg-[#6c5ce7] text-white text-sm font-medium hover:bg-[#4834d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors mb-6"
        >
          {loading ? 'Projecting...' : 'Run Projection'}
        </button>

        {/* Results */}
        {projection && (
          <div className="space-y-6">
            {/* Score comparison */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-[#f3f2f7] rounded-lg p-4">
                <p className="text-xs text-[#888] uppercase tracking-wider mb-1">Current Score</p>
                <p className="text-3xl font-bold" style={{ color: scoreColor(projection.baseline.stress_score) }}>
                  {projection.baseline.stress_score}
                </p>
                <p className="text-xs text-[#888] mt-1">{projection.baseline.stress_level}</p>
              </div>
              <div className="bg-[#f3f2f7] rounded-lg p-4">
                <p className="text-xs text-[#888] uppercase tracking-wider mb-1">Projected Score</p>
                <p className="text-3xl font-bold" style={{ color: scoreColor(projection.projected.stress_score) }}>
                  {projection.projected.stress_score}
                </p>
                <p className="text-xs text-[#888] mt-1">{projection.projected.stress_level}</p>
              </div>
              <div className="bg-[#f3f2f7] rounded-lg p-4">
                <p className="text-xs text-[#888] uppercase tracking-wider mb-1">Impact</p>
                <p className={`text-3xl font-bold ${projection.delta > 0 ? 'text-[#e84393]' : 'text-[#00b894]'}`}>
                  {projection.delta > 0 ? '+' : ''}{projection.delta}
                </p>
                <p className="text-xs text-[#888] mt-1">
                  Latency: {projection.baseline.redemption_latency_hours} → {projection.projected.redemption_latency_hours}
                </p>
              </div>
            </div>

            {/* Dimension deltas chart */}
            <div>
              <h3 className="text-xs font-semibold text-[#0f0f0f] uppercase tracking-wider mb-3">
                Per-Dimension Impact
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={projection.dimensions.map(d => ({
                    name: d.name.replace(/\s*\(.*\)/, ''),
                    baseline: d.baseline_score,
                    projected: d.projected_score,
                    delta: d.delta,
                  }))}
                  layout="vertical"
                  margin={{ left: 140 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f2f7" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#555' }} width={130} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #eee', fontSize: 12 }}
                    formatter={(value: number, name: string) => [
                      value.toFixed(1),
                      name === 'baseline' ? 'Current' : 'Projected',
                    ]}
                  />
                  <Bar dataKey="baseline" fill="#a29bfe" fillOpacity={0.4} radius={[0, 3, 3, 0]} barSize={10} />
                  <Bar dataKey="projected" radius={[0, 3, 3, 0]} barSize={10}>
                    {projection.dimensions.map((d, i) => (
                      <Cell key={i} fill={d.delta > 5 ? '#e84393' : d.delta > 0 ? '#e17055' : '#00b894'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Scenario description */}
            <div className="text-xs text-[#888] bg-[#f3f2f7] rounded-lg px-4 py-3">
              <span className="font-medium text-[#555]">Scenario: </span>
              {projection.scenario.rate_hike_bps && `+${projection.scenario.rate_hike_bps}bps rate hike`}
              {projection.scenario.hurricane && ` | Cat ${projection.scenario.hurricane.category} hurricane at ${projection.scenario.hurricane.lat.toFixed(1)}°N`}
              {projection.scenario.bank_failure && ` | ${projection.scenario.bank_failure} stress event`}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
