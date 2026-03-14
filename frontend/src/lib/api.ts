import type { ApiResponse, StressScore, WeatherData, GraphData, ProjectionRequest, ProjectionResult, NarrativeResult, DetectedScenario, BacktestResult, BacktestSummary } from './types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function fetchApi<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

async function postApi<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function fetchStressScores(): Promise<ApiResponse<StressScore[]>> {
  return fetchApi<StressScore[]>('/api/stress-scores/')
}

export async function fetchStressScore(symbol: string): Promise<ApiResponse<StressScore>> {
  return fetchApi<StressScore>(`/api/stress-scores/${symbol}`)
}

export async function fetchActiveWeather(): Promise<ApiResponse<WeatherData>> {
  return fetchApi<WeatherData>('/api/weather/active')
}

export async function fetchGraph(): Promise<ApiResponse<GraphData>> {
  return fetchApi<GraphData>('/api/graph/')
}

export async function projectScenario(params: ProjectionRequest): Promise<ApiResponse<ProjectionResult>> {
  return postApi<ProjectionResult>('/api/stress-scores/project', params)
}

export async function fetchNarrative(stressContext: string): Promise<ApiResponse<NarrativeResult>> {
  return postApi<NarrativeResult>('/api/narratives/', { stress_context: stressContext })
}

export async function fetchActiveScenarios(): Promise<ApiResponse<DetectedScenario[]>> {
  return fetchApi<DetectedScenario[]>('/api/stress-scores/scenarios/active')
}

export async function fetchBacktests(): Promise<ApiResponse<BacktestSummary[]>> {
  return fetchApi<BacktestSummary[]>('/api/backtests/')
}

export async function fetchBacktest(name: string): Promise<ApiResponse<BacktestResult>> {
  return fetchApi<BacktestResult>(`/api/backtests/${name}`)
}
