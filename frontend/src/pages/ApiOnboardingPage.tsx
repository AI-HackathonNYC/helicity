import { useState } from 'react'

export function ApiOnboardingPage() {
  const [showKey, setShowKey] = useState(false)
  const [activeLang, setActiveLang] = useState<'curl' | 'python' | 'ts'>('curl')

  return (
    <div className="space-y-12 pb-12 animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="bg-white rounded-xl shadow-sm border border-black/5 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#6c5ce7]/10 to-[#a29bfe]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-[#0f0f0f] mb-4">
            Developer Portal
          </h1>
          <p className="text-lg text-[#555] mb-8 leading-relaxed">
            Integrate the Helicity scoring engine into your DAO treasury, DeFi protocol, or AI agent workflow. Access real-time reserve risk data via REST API or MCP.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#api-keys" className="px-5 py-2.5 bg-[#0f0f0f] text-white rounded-lg font-medium hover:bg-black/80 transition-colors shadow-sm text-sm">
              API Keys
            </a>
            <a href="#sdk-quickstart" className="px-5 py-2.5 bg-white text-[#0f0f0f] border border-black/10 rounded-lg font-medium hover:bg-black/5 transition-colors text-sm">
              SDK Quickstart
            </a>
            <a href="#rest-api" className="px-5 py-2.5 bg-white text-[#0f0f0f] border border-black/10 rounded-lg font-medium hover:bg-black/5 transition-colors text-sm">
              REST API
            </a>
            <a href="#mcp-server" className="px-5 py-2.5 bg-white text-[#0f0f0f] border border-black/10 rounded-lg font-medium hover:bg-black/5 transition-colors text-sm">
              MCP Server
            </a>
          </div>
        </div>
      </section>

      {/* API Key Management */}
      <section id="api-keys" className="bg-white rounded-xl shadow-sm border border-black/5 p-8 scroll-mt-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#00b894]/10 flex items-center justify-center text-[#00b894]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-[#0f0f0f]">API Key Management</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2 bg-[#fafafa] rounded-lg border border-black/5 p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-[#0f0f0f]">Active Production Key</span>
              <span className="text-xs bg-[#00b894]/10 text-[#00b894] px-2 py-1 rounded font-medium">Active</span>
            </div>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-white border border-black/10 rounded px-3 py-2.5 text-sm text-[#0f0f0f] font-mono">
                {showKey ? 'sk-heli-live-9f8e7d...a1b2c3' : 'sk-heli-live-••••••••••••••••••••••'}
              </code>
              <button 
                onClick={() => setShowKey(!showKey)}
                className="px-3 py-2.5 bg-white text-[#555] border border-black/10 rounded hover:bg-black/5 transition-colors flex items-center justify-center"
                title={showKey ? "Hide" : "Reveal"}
              >
                {showKey ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
              <button className="px-4 py-2.5 bg-[#6c5ce7] text-white rounded font-medium text-sm hover:bg-[#4834d4] transition-colors shadow-sm">
                Copy
              </button>
            </div>
            <div className="mt-4 flex gap-3">
              <button className="text-sm font-medium text-[#e17055] hover:underline">Roll Key</button>
              <span className="text-black/20">|</span>
              <button className="text-sm font-medium text-[#555] hover:text-[#0f0f0f] hover:underline">Revoke</button>
            </div>
          </div>

          <div className="bg-[#fafafa] rounded-lg border border-black/5 p-5">
            <h3 className="text-sm font-bold text-[#0f0f0f] mb-4">Usage Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#555]">Requests Today</span>
                  <span className="font-mono font-medium text-[#0f0f0f]">1,248</span>
                </div>
                <div className="w-full bg-black/5 rounded-full h-1.5">
                  <div className="bg-[#6c5ce7] h-1.5 rounded-full" style={{ width: '12%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#555]">Requests This Month</span>
                  <span className="font-mono font-medium text-[#0f0f0f]">45,201 <span className="text-[#888] font-sans text-xs">/ 100k</span></span>
                </div>
                <div className="w-full bg-black/5 rounded-full h-1.5">
                  <div className="bg-[#6c5ce7] h-1.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SDK Quickstart */}
      <section id="sdk-quickstart" className="bg-white rounded-xl shadow-sm border border-black/5 p-8 scroll-mt-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#0f0f0f]/10 flex items-center justify-center text-[#0f0f0f]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
          </div>
          <h2 className="text-2xl font-bold text-[#0f0f0f]">SDK Quickstart</h2>
        </div>

        <div className="bg-[#0c0a14] rounded-lg overflow-hidden">
          <div className="flex bg-[#1a1825] px-2 py-2 border-b border-white/10 gap-2 overflow-x-auto">
            <button 
              onClick={() => setActiveLang('curl')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activeLang === 'curl' ? 'bg-[#6c5ce7] text-white' : 'text-[#888] hover:text-white hover:bg-white/5'}`}
            >
              cURL
            </button>
            <button 
              onClick={() => setActiveLang('python')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activeLang === 'python' ? 'bg-[#6c5ce7] text-white' : 'text-[#888] hover:text-white hover:bg-white/5'}`}
            >
              Python (httpx)
            </button>
            <button 
              onClick={() => setActiveLang('ts')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${activeLang === 'ts' ? 'bg-[#6c5ce7] text-white' : 'text-[#888] hover:text-white hover:bg-white/5'}`}
            >
              TypeScript
            </button>
          </div>
          <div className="p-5">
            {activeLang === 'curl' && (
              <pre className="text-sm text-[#e2e8f0] font-mono leading-relaxed overflow-x-auto">
<span className="text-[#a29bfe]">curl</span> -X GET https://api.helicity.network/v1/stress-scores \
  -H <span className="text-[#00b894]">"Authorization: Bearer sk-heli-live-..."</span>
              </pre>
            )}
            {activeLang === 'python' && (
              <pre className="text-sm text-[#e2e8f0] font-mono leading-relaxed overflow-x-auto">
<span className="text-[#e84393]">import</span> httpx

headers = &#123;
    <span className="text-[#00b894]">"Authorization"</span>: <span className="text-[#00b894]">"Bearer sk-heli-live-..."</span>
&#125;

<span className="text-[#e84393]">with</span> httpx.Client() <span className="text-[#e84393]">as</span> client:
    response = client.get(<span className="text-[#00b894]">"https://api.helicity.network/v1/stress-scores"</span>, headers=headers)
    data = response.json()
    <span className="text-[#888]"># &#123;"data": [&#123;"symbol": "USDC", "score": 12, ...&#125;], ...&#125;</span>
              </pre>
            )}
            {activeLang === 'ts' && (
              <pre className="text-sm text-[#e2e8f0] font-mono leading-relaxed overflow-x-auto">
<span className="text-[#e84393]">const</span> response = <span className="text-[#e84393]">await</span> fetch(<span className="text-[#00b894]">'https://api.helicity.network/v1/stress-scores'</span>, &#123;
  headers: &#123;
    <span className="text-[#00b894]">'Authorization'</span>: <span className="text-[#00b894]">'Bearer sk-heli-live-...'</span>
  &#125;
&#125;);

<span className="text-[#e84393]">const</span> &#123; data &#125; = <span className="text-[#e84393]">await</span> response.json();
<span className="text-[#888]">// [&#123;symbol: "USDC", score: 12, ...&#125;]</span>
              </pre>
            )}
          </div>
        </div>
      </section>

      {/* REST API Section */}
      <section id="rest-api" className="bg-white rounded-xl shadow-sm border border-black/5 p-8 scroll-mt-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#6c5ce7]/10 flex items-center justify-center text-[#6c5ce7]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#0f0f0f]">REST API Documentation</h2>
            <p className="text-[#555] mt-1 text-sm">Base URL: <code className="bg-[#fafafa] border border-black/10 px-1.5 py-0.5 rounded ml-1 font-mono text-xs">https://api.helicity.network/v1</code></p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#fafafa] p-4 rounded-lg border border-black/5">
            <h3 className="text-sm font-bold text-[#0f0f0f] mb-2">Authentication</h3>
            <p className="text-sm text-[#555]">All endpoints require a Bearer token in the <code className="text-xs font-mono">Authorization</code> header.</p>
          </div>
          <div className="bg-[#fafafa] p-4 rounded-lg border border-black/5">
            <h3 className="text-sm font-bold text-[#0f0f0f] mb-2">Rate Limits</h3>
            <p className="text-sm text-[#555]">100 requests / minute per active key. IPFS pinning endpoints are limited to 10 / minute.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Endpoint 1 */}
          <div className="border border-black/10 rounded-xl overflow-hidden">
            <div className="bg-[#fafafa] border-b border-black/10 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-[#00b894]/10 text-[#00b894] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">GET</span>
                <code className="text-[#0f0f0f] font-mono text-sm font-medium">/api/stress-scores</code>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-[#555] mb-4">Returns liquidity stress scores for all tracked stablecoins.</p>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#888] mb-2">Response Schema</h4>
              <div className="bg-[#0c0a14] rounded-lg p-4">
                <pre className="text-xs text-[#e2e8f0] font-mono leading-relaxed overflow-x-auto">
&#123;
  <span className="text-[#6c5ce7]">"data"</span>: [
    &#123;
      "symbol": "USDC",
      "score": 12,
      "latency_hours": 4,
      "lcr_estimate": 1.05
    &#125;
  ],
  <span className="text-[#6c5ce7]">"error"</span>: null,
  <span className="text-[#6c5ce7]">"timestamp"</span>: "2026-03-14T00:00:00Z"
&#125;
                </pre>
              </div>
            </div>
          </div>

          {/* Endpoint 2 */}
          <div className="border border-black/10 rounded-xl overflow-hidden">
            <div className="bg-[#fafafa] border-b border-black/10 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-[#00b894]/10 text-[#00b894] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">GET</span>
                <code className="text-[#0f0f0f] font-mono text-sm font-medium">/api/stress-scores/&#123;symbol&#125;</code>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-[#555] mb-4">Returns a single stablecoin's detailed 6-dimension breakdown and consensus narrative.</p>
            </div>
          </div>

          {/* Endpoint 3 */}
          <div className="border border-black/10 rounded-xl overflow-hidden">
            <div className="bg-[#fafafa] border-b border-black/10 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-[#e17055]/10 text-[#e17055] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">POST</span>
                <code className="text-[#0f0f0f] font-mono text-sm font-medium">/api/stress-scores/project</code>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-[#555] mb-4">Projects a scenario analysis given specific macro/weather shocks.</p>
            </div>
          </div>

          {/* Endpoint 4 */}
          <div className="border border-black/10 rounded-xl overflow-hidden">
            <div className="bg-[#fafafa] border-b border-black/10 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-[#00b894]/10 text-[#00b894] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">GET</span>
                <code className="text-[#0f0f0f] font-mono text-sm font-medium">/api/weather/active</code>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-[#555] mb-4">Returns active NOAA events with estimated operational impact.</p>
            </div>
          </div>

          {/* Endpoint 5 */}
          <div className="border border-black/10 rounded-xl overflow-hidden">
            <div className="bg-[#fafafa] border-b border-black/10 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-[#00b894]/10 text-[#00b894] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">GET</span>
                <code className="text-[#0f0f0f] font-mono text-sm font-medium">/api/graph</code>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-[#555] mb-4">Returns the complete knowledge graph configuration (nodes, edges, weights).</p>
            </div>
          </div>
        </div>
      </section>

      {/* MCP Server Section */}
      <section id="mcp-server" className="bg-white rounded-xl shadow-sm border border-black/5 p-8 scroll-mt-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#e84393]/10 flex items-center justify-center text-[#e84393]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <h2 className="text-2xl font-bold text-[#0f0f0f]">MCP Server Setup</h2>
        </div>
        
        <p className="text-[#555] mb-8">
          The Model Context Protocol (MCP) server allows AI trading bots and agent frameworks to query risk scores as tool calls before executing stablecoin positions.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#fafafa] rounded-xl border border-black/5 p-6">
            <h3 className="text-lg font-bold text-[#0f0f0f] mb-3">Tool Reference</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] mt-2"></div>
                <div>
                  <code className="bg-white border border-black/10 px-1 py-0.5 rounded text-xs font-mono font-medium text-[#0f0f0f]">get_stress_scores</code>
                  <p className="text-sm text-[#888] mt-1">Returns all tracked scores.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] mt-2"></div>
                <div>
                  <code className="bg-white border border-black/10 px-1 py-0.5 rounded text-xs font-mono font-medium text-[#0f0f0f]">get_stablecoin_detail(symbol)</code>
                  <p className="text-sm text-[#888] mt-1">Returns dimension breakdown.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] mt-2"></div>
                <div>
                  <code className="bg-white border border-black/10 px-1 py-0.5 rounded text-xs font-mono font-medium text-[#0f0f0f]">project_scenario(macro_shock)</code>
                  <p className="text-sm text-[#888] mt-1">Projects stress scores under various scenarios.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] mt-2"></div>
                <div>
                  <code className="bg-white border border-black/10 px-1 py-0.5 rounded text-xs font-mono font-medium text-[#0f0f0f]">get_active_alerts()</code>
                  <p className="text-sm text-[#888] mt-1">NOAA weather events + ops impact.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] mt-2"></div>
                <div>
                  <code className="bg-white border border-black/10 px-1 py-0.5 rounded text-xs font-mono font-medium text-[#0f0f0f]">get_score_history(symbol)</code>
                  <p className="text-sm text-[#888] mt-1">Historical scores with IPFS CIDs.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="bg-[#fafafa] rounded-xl border border-black/5 p-6">
            <h3 className="text-lg font-bold text-[#0f0f0f] mb-4">Transports</h3>
            
            <div className="mb-6">
              <h4 className="text-sm font-bold text-[#0f0f0f] mb-2 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                stdio (Local Agents)
              </h4>
              <p className="text-sm text-[#555] mb-2">Run the server as a subprocess for local agents like Claude Code or Cursor. Config via `mcp.json`.</p>
            </div>
            
            <div>
              <h4 className="text-sm font-bold text-[#0f0f0f] mb-2 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                SSE (Remote Agents)
              </h4>
              <p className="text-sm text-[#555]">Connect remote agents to the hosted MCP server over Server-Sent Events utilizing API Key authentication.</p>
              <code className="block mt-2 text-xs bg-white border border-black/10 px-2 py-1 rounded font-mono text-[#0f0f0f]">https://api.helicity.network/mcp/sse</code>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0c0a14] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs uppercase tracking-wider text-[#bbbbbb] font-medium">Claude Desktop Config JSON (stdio)</span>
            </div>
            <pre className="text-sm text-white font-mono overflow-x-auto whitespace-pre">
&#123;
  <span className="text-[#6c5ce7]">"mcpServers"</span>: &#123;
    <span className="text-[#6c5ce7]">"helicity"</span>: &#123;
      "command": "python",
      "args": ["-m", "helicity.mcp_server"],
      "env": &#123; 
        "HELICITY_API_KEY": "sk-heli-live-..."
      &#125;
    &#125;
  &#125;
&#125;
            </pre>
          </div>

          <div className="bg-[#0c0a14] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs uppercase tracking-wider text-[#bbbbbb] font-medium">Custom Agent Integration (Python fastmcp client)</span>
            </div>
            <pre className="text-sm text-white font-mono overflow-x-auto whitespace-pre">
<span className="text-[#e84393]">from</span> fastmcp <span className="text-[#e84393]">import</span> FastMCPClient

<span className="text-[#888]"># Connect to Helicity via SSE</span>
client = FastMCPClient(
    url=<span className="text-[#00b894]">"https://api.helicity.network/mcp/sse"</span>,
    headers=&#123;<span className="text-[#00b894]">"Authorization"</span>: <span className="text-[#00b894]">"Bearer sk-heli-live-..."</span>&#125;
)

<span className="text-[#888]"># Use tools in your agent loop</span>
scores = client.call_tool(<span className="text-[#00b894]">"get_stress_scores"</span>)
print(scores)
            </pre>
          </div>
        </div>
      </section>
    </div>
  )
}
