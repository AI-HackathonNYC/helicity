import { useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const CODE_COLORS = 'bg-[#0c0a14] text-[#a29bfe] font-mono text-sm rounded-xl p-4 overflow-x-auto'
const LABEL = 'text-xs uppercase tracking-widest text-[#888] font-semibold mb-1'
const SECTION_TITLE = 'text-lg font-bold text-[#0f0f0f] mb-1'
const SECTION_DESC = 'text-sm text-[#555] mb-4'

type Tab = 'stdio' | 'sse' | 'example' | 'tools'

export function DeveloperPortalPage() {
  const [tab, setTab] = useState<Tab>('stdio')

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-2">
      {/* Header */}
      <div>
        <div className={LABEL}>Developer Portal</div>
        <h2 className="text-3xl font-bold text-[#0f0f0f] mb-2">
          MCP Server — AI Agent Integration
        </h2>
        <p className="text-[#555] text-base max-w-2xl">
          Helicity exposes reserve risk scores as{' '}
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6c5ce7] underline underline-offset-2"
          >
            Model Context Protocol
          </a>{' '}
          tool calls. AI trading bots and agent frameworks can query Liquidity Stress Scores,
          project scenarios, and receive weather alerts before executing stablecoin positions.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tools', value: '5' },
          { label: 'Transports', value: 'stdio · SSE' },
          { label: 'Stablecoins', value: 'USDC · USDT · DAI · FRAX · PYUSD · TUSD' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-black/7 rounded-xl p-4">
            <div className={LABEL}>{label}</div>
            <div className="text-[#0f0f0f] font-semibold text-sm">{value}</div>
          </div>
        ))}
      </div>

      {/* Tab selector */}
      <div>
        <div className="flex gap-1 border-b border-black/7 mb-6">
          {([
            { id: 'stdio', label: 'Claude Desktop (stdio)' },
            { id: 'sse', label: 'Remote Agent (SSE)' },
            { id: 'example', label: 'Python Example' },
            { id: 'tools', label: 'Tool Reference' },
          ] as { id: Tab; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-[#6c5ce7] text-[#6c5ce7]'
                  : 'border-transparent text-[#888] hover:text-[#0f0f0f]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'stdio' && <StdioTab />}
        {tab === 'sse' && <SseTab backendUrl={BACKEND_URL} />}
        {tab === 'example' && <ExampleTab backendUrl={BACKEND_URL} />}
        {tab === 'tools' && <ToolsTab />}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function StdioTab() {
  const configJson = JSON.stringify(
    {
      mcpServers: {
        helicity: {
          command: 'python3',
          args: ['/path/to/helicity/backend/mcp_server.py'],
          env: {
            ANTHROPIC_API_KEY: 'your-key',
            GEMINI_API_KEY: 'your-key',
            ETHERSCAN_API_KEY: 'your-key',
          },
        },
      },
    },
    null,
    2,
  )

  return (
    <div className="space-y-6">
      <div>
        <div className={SECTION_TITLE}>Claude Desktop — stdio transport</div>
        <p className={SECTION_DESC}>
          For local agent use. Add the following block to{' '}
          <code className="bg-black/5 px-1 rounded text-xs">
            ~/Library/Application Support/Claude/claude_desktop_config.json
          </code>
          .
        </p>
        <pre className={CODE_COLORS}>{configJson}</pre>
      </div>

      <div>
        <div className={SECTION_TITLE}>Run manually</div>
        <p className={SECTION_DESC}>
          From the <code className="bg-black/5 px-1 rounded text-xs">backend/</code> directory with
          Python 3.11+:
        </p>
        <pre className={CODE_COLORS}>{`# Install deps (first time)
pip install -r requirements.txt

# Run MCP server on stdio (default)
python mcp_server.py`}</pre>
      </div>

      <div className="bg-[#f3f2f7] border border-black/7 rounded-xl p-4 text-sm text-[#555]">
        <strong className="text-[#0f0f0f]">Requires Python 3.11+</strong> — fastmcp does not
        support Python 3.9. The project ships a <code>.venv</code> at{' '}
        <code>backend/.venv</code> with all dependencies pre-installed.
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function SseTab({ backendUrl }: { backendUrl: string }) {
  const sseUrl = backendUrl.replace(':8000', ':8001')

  return (
    <div className="space-y-6">
      <div>
        <div className={SECTION_TITLE}>Remote Agent — SSE transport</div>
        <p className={SECTION_DESC}>
          For remote or cloud-hosted agents. Start the MCP server in SSE mode and connect via
          HTTP Server-Sent Events.
        </p>
        <pre className={CODE_COLORS}>{`# Start MCP server on SSE transport (port 8001)
TRANSPORT=sse MCP_PORT=8001 python mcp_server.py`}</pre>
      </div>

      <div>
        <div className={SECTION_TITLE}>Connection config</div>
        <pre className={CODE_COLORS}>{JSON.stringify(
          {
            mcpServers: {
              helicity: {
                url: `${sseUrl}/sse`,
                transport: 'sse',
                headers: {
                  Authorization: 'Bearer <your-api-key>',
                },
              },
            },
          },
          null,
          2,
        )}</pre>
      </div>

      <div>
        <div className={SECTION_TITLE}>Deployed endpoint</div>
        <p className={SECTION_DESC}>
          On Railway/Render, set <code className="bg-black/5 px-1 rounded text-xs">TRANSPORT=sse</code>{' '}
          and <code className="bg-black/5 px-1 rounded text-xs">MCP_PORT=8001</code> as environment
          variables. The SSE endpoint will be available at:
        </p>
        <pre className={CODE_COLORS}>{`https://your-backend.railway.app/sse`}</pre>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function ExampleTab({ backendUrl: _ }: { backendUrl: string }) {
  return (
    <div className="space-y-6">
      <div>
        <div className={SECTION_TITLE}>Python agent — fastmcp client</div>
        <p className={SECTION_DESC}>
          Use the <code className="bg-black/5 px-1 rounded text-xs">fastmcp</code> client SDK to
          call Helicity tools from any Python agent.
        </p>
        <pre className={CODE_COLORS}>{`import asyncio
from fastmcp import Client

async def main():
    async with Client("python mcp_server.py") as client:
        # Get all current stress scores
        scores = await client.call_tool("get_stress_scores", {})
        for coin in scores["data"]:
            print(f"{coin['stablecoin']}: {coin['stress_score']}/100 — {coin['stress_level']}")

        # Deep-dive on USDC
        detail = await client.call_tool("get_stablecoin_detail", {"symbol": "USDC"})
        print(detail["data"]["narrative"])

        # Project a rate hike scenario
        projection = await client.call_tool("project_scenario", {
            "symbol": "USDC",
            "rate_hike_bps": 100,
        })
        print(f"USDC delta: +{projection['data']['delta']} pts under 100bps hike")

        # Check active weather alerts
        alerts = await client.call_tool("get_active_alerts", {})
        print(f"States with alerts: {list(alerts['data']['weather_alerts'].keys())}")

asyncio.run(main())`}</pre>
      </div>

      <div>
        <div className={SECTION_TITLE}>Claude agent (tool use)</div>
        <p className={SECTION_DESC}>
          An AI trading agent can declare Helicity tools and let Claude decide when to invoke them.
        </p>
        <pre className={CODE_COLORS}>{`import anthropic

client = anthropic.Anthropic()

# Describe Helicity MCP tools as Claude tool definitions
tools = [
    {
        "name": "get_stress_scores",
        "description": "Get Liquidity Stress Scores for all tracked stablecoins.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "project_scenario",
        "description": "Project stress score under a rate hike or hurricane.",
        "input_schema": {
            "type": "object",
            "properties": {
                "symbol": {"type": "string"},
                "rate_hike_bps": {"type": "integer"},
                "hurricane_lat": {"type": "number"},
                "hurricane_lng": {"type": "number"},
                "hurricane_category": {"type": "integer"},
                "bank_failure": {"type": "string"},
            },
            "required": ["symbol"],
        },
    },
]

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    tools=tools,
    messages=[{
        "role": "user",
        "content": "Should I reduce my USDC position if the Fed hikes by 75bps?",
    }],
)
# Claude will call get_stress_scores + project_scenario before answering`}</pre>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function ToolsTab() {
  const tools = [
    {
      name: 'get_stress_scores',
      description: 'Return current Liquidity Stress Scores for all tracked stablecoins.',
      params: [],
      example: {
        data: [
          {
            stablecoin: 'USDC',
            stress_score: 42.5,
            stress_level: 'Moderate Stress',
            redemption_latency_hours: '4-24h',
            liquidity_coverage_ratio: '95-100%',
            resolution_source: 'live',
          },
        ],
        error: null,
        timestamp: '2026-03-13T12:00:00Z',
      },
    },
    {
      name: 'get_stablecoin_detail',
      description: 'Return the full 6-dimension stress score breakdown for a single stablecoin.',
      params: [{ name: 'symbol', type: 'string', required: true, desc: 'Ticker, e.g. "USDC"' }],
      example: {
        data: {
          stablecoin: 'USDC',
          stress_score: 42.5,
          stress_level: 'Moderate Stress',
          dimensions: [
            { name: 'Duration Risk (WAM)', score: 55.0, weight: 0.3 },
            { name: 'Reserve Transparency', score: 30.0, weight: 0.2 },
          ],
          narrative: 'USDC stress is moderate. BNY Mellon holds 35% of reserves...',
          jury: { claude_score: 40, gemini_score: 43, delta: 3, consensus: true },
        },
        error: null,
        timestamp: '2026-03-13T12:00:00Z',
      },
    },
    {
      name: 'project_scenario',
      description:
        'Project how a stress scenario would affect a stablecoin. At least one scenario param required.',
      params: [
        { name: 'symbol', type: 'string', required: true, desc: 'Ticker' },
        { name: 'rate_hike_bps', type: 'integer', required: false, desc: 'Rate hike in basis points' },
        { name: 'hurricane_lat', type: 'number', required: false, desc: 'Hurricane latitude' },
        { name: 'hurricane_lng', type: 'number', required: false, desc: 'Hurricane longitude' },
        { name: 'hurricane_category', type: 'integer', required: false, desc: '1–5' },
        { name: 'bank_failure', type: 'string', required: false, desc: 'Partial bank name' },
      ],
      example: {
        data: {
          stablecoin: 'USDC',
          scenario: { rate_hike_bps: 100 },
          baseline: { stress_score: 42.5, stress_level: 'Moderate Stress' },
          projected: { stress_score: 58.1, stress_level: 'Elevated Stress' },
          delta: 15.6,
        },
        error: null,
        timestamp: '2026-03-13T12:00:00Z',
      },
    },
    {
      name: 'get_active_alerts',
      description:
        'Return active NOAA weather alerts and their operational impact on reserve processing.',
      params: [],
      example: {
        data: {
          weather_alerts: {
            FL: {
              alerts: [{ event: 'Hurricane Warning', severity: 'Extreme' }],
              alert_count: 1,
            },
          },
          ops_impact: [{ corridor_id: 'us-east-1', corridor_name: 'Northern Virginia', bank: 'BNY Mellon', state: 'FL' }],
          states_checked: ['NY', 'FL', 'CA'],
        },
        error: null,
        timestamp: '2026-03-13T12:00:00Z',
      },
    },
    {
      name: 'get_score_history',
      description: 'Return recent Liquidity Stress Score snapshots for a stablecoin.',
      params: [
        { name: 'symbol', type: 'string', required: true, desc: 'Ticker' },
        { name: 'limit', type: 'integer', required: false, desc: 'Max snapshots (default 10)' },
      ],
      example: {
        data: {
          stablecoin: 'USDC',
          history: [
            { stress_score: 40.1, stress_level: 'Moderate Stress', timestamp: '2026-03-13T11:45:00Z' },
            { stress_score: 42.5, stress_level: 'Moderate Stress', timestamp: '2026-03-13T12:00:00Z' },
          ],
          total_snapshots: 2,
        },
        error: null,
        timestamp: '2026-03-13T12:00:00Z',
      },
    },
  ]

  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <p className={SECTION_DESC}>
        All tools return a standard envelope:{' '}
        <code className="bg-black/5 px-1 rounded text-xs">
          {'{ "data": ..., "error": null, "timestamp": "ISO8601" }'}
        </code>
      </p>
      {tools.map(tool => (
        <div
          key={tool.name}
          className="border border-black/7 rounded-xl overflow-hidden"
        >
          <button
            onClick={() => setOpen(open === tool.name ? null : tool.name)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-black/2 transition-colors"
          >
            <div className="flex items-center gap-3">
              <code className="text-[#6c5ce7] font-mono font-semibold text-sm">{tool.name}</code>
              {tool.params.some(p => p.required) && (
                <span className="text-xs text-[#888]">
                  {tool.params
                    .filter(p => p.required)
                    .map(p => p.name)
                    .join(', ')}
                </span>
              )}
            </div>
            <span className="text-[#888] text-sm">{open === tool.name ? '▲' : '▼'}</span>
          </button>

          {open === tool.name && (
            <div className="px-5 pb-5 border-t border-black/5 space-y-4 pt-4">
              <p className="text-sm text-[#555]">{tool.description}</p>

              {tool.params.length > 0 && (
                <div>
                  <div className={LABEL}>Parameters</div>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-left text-[#888] text-xs uppercase tracking-widest">
                        <th className="pb-1 pr-4 font-medium">Name</th>
                        <th className="pb-1 pr-4 font-medium">Type</th>
                        <th className="pb-1 pr-4 font-medium">Required</th>
                        <th className="pb-1 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tool.params.map(p => (
                        <tr key={p.name} className="border-t border-black/5">
                          <td className="py-1.5 pr-4">
                            <code className="text-[#6c5ce7] text-xs">{p.name}</code>
                          </td>
                          <td className="py-1.5 pr-4 text-[#888] text-xs">{p.type}</td>
                          <td className="py-1.5 pr-4 text-xs">
                            {p.required ? (
                              <span className="text-[#e17055]">required</span>
                            ) : (
                              <span className="text-[#888]">optional</span>
                            )}
                          </td>
                          <td className="py-1.5 text-[#555] text-xs">{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div>
                <div className={LABEL}>Example response</div>
                <pre className={CODE_COLORS}>{JSON.stringify(tool.example, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
