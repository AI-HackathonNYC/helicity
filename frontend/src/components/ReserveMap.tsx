import { useCallback, useRef, useEffect, useMemo } from 'react'
import Globe from 'react-globe.gl'
import { usePolling } from '../hooks/usePolling'
import { fetchGraph } from '../lib/api'
import type { GraphData } from '../lib/types'

/* ─── color helpers ─── */
const CORRIDOR_COLORS: Record<string, string> = {
  'us-east-1': '#6c5ce7',
  'us-east-2': '#a29bfe',
  'us-west-2': '#00b894',
  'us-central': '#e17055',
  'eu-west-1': '#4834d4',
}

const CORRIDOR_CENTERS: Record<string, { lat: number; lng: number }> = {
  'us-east-1': { lat: 39.0, lng: -77.5 },
  'us-east-2': { lat: 41.1, lng: -82.7 },
  'us-west-2': { lat: 45.1, lng: -120.5 },
  'us-central': { lat: 41.5, lng: -91.7 },
  'eu-west-1': { lat: 53.3, lng: -3.0 },
}

function scoreColor(ltv: number | null): string {
  if (ltv === null) return '#888888'
  if (ltv < 0.6) return '#00b894'
  if (ltv < 0.7) return '#e17055'
  return '#e84393'
}

/* ─── types for globe data ─── */
interface GlobePoint {
  lat: number
  lng: number
  name: string
  color: string
  size: number
  type: 'bank' | 'datacenter'
  detail: string
}

interface GlobeArc {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color: string
}

interface GlobeRing {
  lat: number
  lng: number
  maxR: number
  propagationSpeed: number
  repeatPeriod: number
  color: string
}

export function ReserveMap() {
  const fetcher = useCallback(() => fetchGraph(), [])
  const { data, loading } = usePolling<GraphData>(fetcher, 120000)
  const globeRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any

  // Auto-rotate & initial view
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls()
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.4
      controls.enableZoom = true
      globeRef.current.pointOfView({ lat: 35, lng: -50, altitude: 2.2 }, 1000)
    }
  }, [data])

  // Build globe data from graph
  const { points, arcs, rings } = useMemo(() => {
    if (!data) return { points: [] as GlobePoint[], arcs: [] as GlobeArc[], rings: [] as GlobeRing[] }

    const bankNodes = data.nodes.filter(n => n.type === 'bank' && n.lat && n.lng)
    const dcNodes = data.nodes.filter(n => n.type === 'datacenter')

    // Bank edge info
    const bankEdges: Record<string, { percentage: number; stablecoins: string[] }> = {}
    for (const edge of data.edges) {
      if (edge.type === 'holds_reserves_at') {
        const bankId = edge.target
        if (!bankEdges[bankId]) bankEdges[bankId] = { percentage: 0, stablecoins: [] }
        bankEdges[bankId].percentage += (edge.percentage as number) || 0
        const coinNode = data.nodes.find(n => n.id === edge.source)
        if (coinNode?.symbol) {
          bankEdges[bankId].stablecoins.push(coinNode.symbol as string)
        }
      }
    }

    // Points: banks + datacenters
    const pts: GlobePoint[] = []

    for (const bank of bankNodes) {
      const ltv = bank.fdic_ltv_ratio as number | null
      const edgeInfo = bankEdges[bank.id]
      const size = edgeInfo ? Math.max(0.3, edgeInfo.percentage / 25) : 0.3
      pts.push({
        lat: bank.lat as number,
        lng: bank.lng as number,
        name: bank.name as string,
        color: scoreColor(ltv),
        size,
        type: 'bank',
        detail: `LTV: ${ltv !== null ? (ltv * 100).toFixed(0) + '%' : 'N/A'} | Maturity: ${bank.maturity_days}d${edgeInfo ? ` | Reserves: ${edgeInfo.percentage.toFixed(0)}% (${edgeInfo.stablecoins.join(', ')})` : ''}`,
      })
    }

    for (const dc of dcNodes) {
      const corridorId = dc.corridor_id as string
      const center = CORRIDOR_CENTERS[corridorId]
      if (!center) continue
      pts.push({
        lat: center.lat,
        lng: center.lng,
        name: dc.name as string,
        color: CORRIDOR_COLORS[corridorId] || '#6c5ce7',
        size: 0.4,
        type: 'datacenter',
        detail: `Corridor: ${corridorId}`,
      })
    }

    // Arcs: bank → datacenter connections via edges
    const arcList: GlobeArc[] = []
    for (const edge of data.edges) {
      if (edge.type === 'operates_from') {
        const bankNode = data.nodes.find(n => n.id === edge.source)
        const dcNode = data.nodes.find(n => n.id === edge.target)
        if (bankNode?.lat && bankNode?.lng && dcNode) {
          const corridorId = dcNode.corridor_id as string
          const dcCenter = CORRIDOR_CENTERS[corridorId]
          if (dcCenter) {
            arcList.push({
              startLat: bankNode.lat as number,
              startLng: bankNode.lng as number,
              endLat: dcCenter.lat,
              endLng: dcCenter.lng,
              color: CORRIDOR_COLORS[corridorId] || '#6c5ce7',
            })
          }
        }
      }
    }

    // Rings: pulse on datacenter corridors
    const ringList: GlobeRing[] = dcNodes
      .map(dc => {
        const corridorId = dc.corridor_id as string
        const center = CORRIDOR_CENTERS[corridorId]
        if (!center) return null
        return {
          lat: center.lat,
          lng: center.lng,
          maxR: 3,
          propagationSpeed: 2,
          repeatPeriod: 1200,
          color: CORRIDOR_COLORS[corridorId] || '#6c5ce7',
        }
      })
      .filter(Boolean) as GlobeRing[]

    return { points: pts, arcs: arcList, rings: ringList }
  }, [data])

  if (loading || !data) {
    return (
      <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#6c5ce7]/30 border-t-[#6c5ce7] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#888]">Initializing globe...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          Reserve Network Globe
        </h2>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider text-[#888]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00b894]" /> Low Risk
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#e17055]" /> Moderate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#e84393]" /> High
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#6c5ce7]" /> Data Center
          </span>
        </div>
      </div>
      <div className="h-[600px] relative" style={{ background: 'radial-gradient(ellipse at center, #0e0c18 0%, #060510 100%)' }}>
        <Globe
          ref={globeRef}
          width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 48, 1200) : 800}
          height={600}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          atmosphereColor="#6c5ce7"
          atmosphereAltitude={0.18}

          // Points: banks & datacenters
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.01}
          pointRadius="size"
          pointLabel={(d: object) => {
            const p = d as GlobePoint
            return `<div style="background:#1a1825;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 12px;font-family:Sora,sans-serif;font-size:11px;color:#e2e8f0;min-width:160px;backdrop-filter:blur(8px)">
              <div style="font-weight:600;margin-bottom:4px;color:white">${p.name}</div>
              <div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px">${p.type === 'bank' ? 'Custodian Bank' : 'Data Center'}</div>
              <div style="color:#aaa">${p.detail}</div>
            </div>`
          }}

          // Arcs: bank ↔ datacenter connections
          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={2000}
          arcStroke={0.5}
          arcAltitudeAutoScale={0.3}

          // Rings: datacenter pulse
          ringsData={rings}
          ringLat="lat"
          ringLng="lng"
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
          ringColor={(d: object) => {
            const r = d as GlobeRing
            return r.color + '40'
          }}
        />
      </div>
    </div>
  )
}
