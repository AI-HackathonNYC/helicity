import { useState, useEffect } from 'react'
import type { ScoreStreamEvent } from '../lib/types'

/**
 * Opens a persistent SSE connection to /api/stream/scores and maintains
 * a map of the latest score event per stablecoin.
 *
 * @param stablecoins - optional filter list, e.g. ["USDC", "USDT"].
 *                      Pass nothing to receive all stablecoin updates.
 */
export function useScoreStream(
  stablecoins?: string[]
): Record<string, ScoreStreamEvent> {
  const [scores, setScores] = useState<Record<string, ScoreStreamEvent>>({})

  useEffect(() => {
    const filter = stablecoins && stablecoins.length > 0
      ? stablecoins.join(',')
      : ''
    const url = `/api/stream/scores${filter ? `?stablecoins=${filter}` : ''}`
    const es = new EventSource(url)

    es.onmessage = (e: MessageEvent) => {
      try {
        const update: ScoreStreamEvent = JSON.parse(e.data)
        // Ignore heartbeats — they carry no score data
        if (update.type === 'heartbeat') return
        setScores(prev => ({ ...prev, [update.stablecoin]: update }))
      } catch {
        // Malformed event — skip silently
      }
    }

    es.onerror = () => {
      // Browser will automatically reconnect on error; no action needed
    }

    return () => {
      es.close()
    }
  }, [stablecoins?.join(',')])  // re-subscribe only if the filter changes

  return scores
}
