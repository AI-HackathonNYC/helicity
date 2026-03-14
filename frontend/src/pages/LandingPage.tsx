import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

/* ────────────────────────── logos ────────────────────────── */
const logos = [
  { name: 'MakerDAO', src: '/logos/mkr-wordmark.svg' },
  { name: 'Aave', src: '/logos/aave-wordmark.svg' },
  { name: 'Compound', src: '/logos/comp-wordmark.svg' },
  { name: 'Chainlink', src: '/logos/link-wordmark.svg' },
  { name: 'USDC', src: '/logos/usdc-wordmark.svg' },
  { name: 'Tether', src: '/logos/usdt-wordmark.svg' },
  { name: 'Uniswap', src: '/logos/uni-wordmark.svg' },
  { name: 'Ethereum', src: '/logos/eth-wordmark.svg' },
]

function LogoConveyor({ items, speed = 25 }: { items: typeof logos; speed?: number }) {
  const setRef = useRef<HTMLDivElement>(null)
  const [setWidth, setSetWidth] = useState(0)

  useEffect(() => {
    const el = setRef.current
    if (!el) return
    const measure = () => setSetWidth(el.scrollWidth)
    const images = el.querySelectorAll('img')
    let loaded = 0
    images.forEach((img) => {
      if (img.complete) {
        loaded++
      } else {
        img.addEventListener('load', () => {
          loaded++
          if (loaded === images.length) measure()
        })
      }
    })
    if (loaded === images.length) measure()
  }, [])

  return (
    <div className="overflow-hidden relative w-full">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-[#0c0a14] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-[#0c0a14] to-transparent z-10" />
      <style>{`
        @keyframes conveyor {
          from { transform: translateX(-${setWidth}px); }
          to { transform: translateX(0); }
        }
      `}</style>
      <div
        className="flex items-center w-max"
        style={{
          animation: setWidth ? `conveyor ${speed}s linear infinite` : 'none',
          willChange: 'transform',
        }}
      >
        <div ref={setRef} className="flex items-center gap-10 shrink-0 pr-10">
          {items.map((logo, i) => (
            <img key={i} src={logo.src} alt={logo.name} className="h-[56px] w-auto shrink-0 opacity-60 hover:opacity-90 transition-opacity" />
          ))}
        </div>
        <div className="flex items-center gap-10 shrink-0 pr-10">
          {items.map((logo, i) => (
            <img key={`d-${i}`} src={logo.src} alt={logo.name} className="h-[56px] w-auto shrink-0 opacity-60" />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────── helpers ────────────────────────── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0
          const step = Math.ceil(target / 60)
          const interval = setInterval(() => {
            start += step
            if (start >= target) { setCount(target); clearInterval(interval) }
            else setCount(start)
          }, 16)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ────────────────────────── component ────────────────────────── */
export function LandingPage() {
  return (
    <div className="text-[#e2e8f0] bg-[#0c0a14] overflow-x-hidden">

      {/* ═══════════════════ 1. HERO ═══════════════════ */}
      <section className="relative min-h-[92vh] flex flex-col">
        {/* Grid overlay for Palantir feel */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(108,92,231,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(108,92,231,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        {/* Radial accent glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#6c5ce7]/8 rounded-full blur-[120px] pointer-events-none" />

        {/* Nav */}
        <nav className="relative z-20 flex items-center justify-between px-8 md:px-16 py-6">
          <div className="flex items-center gap-2.5">
            <svg width="20" height="28" viewBox="0 0 30 44" fill="none" className="overflow-visible">
              <line x1="3" y1="2" x2="9" y2="42" stroke="rgba(108,92,231,0.3)" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="13" y1="2" x2="19" y2="42" stroke="rgba(108,92,231,0.6)" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="23" y1="2" x2="29" y2="42" stroke="#6c5ce7" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
            <span className="text-xl font-bold text-white tracking-[-0.04em]">helicity</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#aaa]">
            <a href="#problem" className="hover:text-white transition-colors">Problem</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#delivery" className="hover:text-white transition-colors">Delivery</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
          <Link
            to="/developers"
            className="px-5 py-2 bg-[#6c5ce7] hover:bg-[#5b4cdb] text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-[#6c5ce7]/20"
          >
            Get API Access
          </Link>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pb-20">
          <h1 className="text-5xl md:text-7xl font-bold text-white max-w-4xl leading-[1.1] tracking-tight mb-6">
            The System of Record for{' '}
            <span className="bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] bg-clip-text text-transparent">
              Stablecoin Reserve Risk
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[#888] max-w-2xl mb-10 leading-relaxed">
            Realtime liquidity stress scores for every major stablecoin. API first infrastructure for DAO treasuries, DeFi protocols, and AI trading agents.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/developers"
              className="px-8 py-3.5 bg-[#6c5ce7] hover:bg-[#5b4cdb] text-white font-semibold rounded-xl transition-all shadow-xl shadow-[#6c5ce7]/25 text-sm"
            >
              Get API Access
              <svg className="inline-block ml-1.5 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </Link>
            <Link
              to="/dashboard"
              className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all text-sm backdrop-blur-sm"
            >
              View Live Dashboard
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
            {[
              { value: 300, suffix: 'B+', label: 'Reserves Monitored' },
              { value: 6, suffix: '', label: 'Stablecoins Tracked' },
              { value: 2, suffix: 's', label: 'Rescore Latency' },
              { value: 19, suffix: '', label: 'Risk Graph Nodes' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">
                  {s.label === 'Reserves Monitored' && '$'}<AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-xs text-[#888] mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#0c0a14] to-transparent" />
      </section>

      {/* ═══════════════════ 2. THE PROBLEM ═══════════════════ */}
      <section id="problem" className="relative py-28 px-6 md:px-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-[#e17055] font-medium">The Problem</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
              $300B+ in Unstressed Reserves
            </h2>
            <p className="text-lg text-[#888] max-w-2xl mx-auto leading-relaxed">
              Stablecoin risk is a <strong className="text-white">duration mismatch problem</strong>, the same failure mode that brought down SVB. Weather and geopolitical events are tail risk multipliers on already fragile balance sheets.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e17055" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ),
                title: 'Duration Mismatch',
                desc: 'Reserves locked in long maturity bonds while redemption demand can spike in hours. This is the SVB failure mode: the catalyst, not a credit event.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e17055" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                ),
                title: '30-Day PDF Lag',
                desc: 'Before the GENIUS Act, reserve disclosures were quarterly PDFs. Even now, most data sits in compliance filings that no one ingests systematically.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e17055" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17.01" y1="12" x2="22.96" y2="12"/><line x1="12" y1="1.05" x2="12" y2="7"/><line x1="12" y1="17.01" x2="12" y2="22.96"/></svg>
                ),
                title: 'No System of Record',
                desc: 'Onchain platforms track wallet flows. Nobody structures the offchain reserve composition, WAM durations, and custodian concentrations into a programmable risk score.',
              },
            ].map((c) => (
              <div
                key={c.title}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:border-[#6c5ce7]/30 transition-colors group"
              >
                <div className="mb-4">{c.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-[#a29bfe] transition-colors">{c.title}</h3>
                <p className="text-sm text-[#888] leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 3. HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" className="relative py-28 px-6 md:px-16 bg-[#0e0c16]">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(rgba(108,92,231,0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-[#6c5ce7] font-medium">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
              Four Data Sources. One Risk Score.
            </h2>
            <p className="text-lg text-[#888] max-w-2xl mx-auto">
              We ingest regulatory filings, onchain flows, bank health data, and weather intelligence, then run a 6 step scoring engine.
            </p>
          </div>

          {/* Pipeline */}
          <div className="flex flex-col md:flex-row items-stretch gap-4">
            {/* Sources */}
            <div className="flex-1 space-y-3">
              <div className="text-xs uppercase tracking-widest text-[#888] mb-4 font-medium">Data Sources</div>
              {[
                { label: 'GENIUS Act Filings', sub: 'XBRL + OCC API' },
                { label: 'Onchain Flows', sub: 'Mint/burn via Etherscan' },
                { label: 'FDIC Call Reports', sub: 'Bank health metrics' },
                { label: 'NOAA / Open-Meteo', sub: 'Weather tail risk' },
              ].map((s) => (
                <div key={s.label} className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-3.5 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#00b894]" />
                  <div>
                    <div className="text-sm font-medium text-white">{s.label}</div>
                    <div className="text-xs text-[#888]">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center px-4">
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none"><path d="M0 12h44m0 0l-8-8m8 8l-8 8" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>

            {/* Engine */}
            <div className="flex-1 bg-gradient-to-br from-[#6c5ce7]/10 to-[#a29bfe]/5 border border-[#6c5ce7]/20 rounded-2xl p-6">
              <div className="text-xs uppercase tracking-widest text-[#a29bfe] mb-4 font-medium">6 Step Engine</div>
              <ol className="space-y-2.5 text-sm">
                {['WAM Duration Analysis', 'Concentration Factor', 'Weather Multiplier', 'LLM Jury Consensus', 'Knowledge Graph Walk', 'Score Aggregation'].map((step, i) => (
                  <li key={step} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#6c5ce7]/20 text-[#a29bfe] text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-[#ccc]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center px-4">
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none"><path d="M0 12h44m0 0l-8-8m8 8l-8 8" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>

            {/* Output */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-xs uppercase tracking-widest text-[#888] mb-4 font-medium">Output</div>
              <div className="bg-[#0c0a14] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                <div>
                  <div className="text-xs text-[#888]">Stress Score</div>
                  <div className="text-3xl font-bold text-white">12 <span className="text-sm font-normal text-[#00b894]">/ 100</span></div>
                </div>
                <div>
                  <div className="text-xs text-[#888]">Redemption Latency</div>
                  <div className="text-lg font-semibold text-white">4 hours</div>
                </div>
                <div>
                  <div className="text-xs text-[#888]">Coverage Ratio</div>
                  <div className="text-lg font-semibold text-white">1.05</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 4. THREE DELIVERY MODES ═══════════════════ */}
      <section id="delivery" className="relative py-28 px-6 md:px-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-[#00b894] font-medium">Delivery</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
              Three Ways to Consume Risk Data
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6c5ce7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                ),
                title: 'REST API',
                audience: 'For Systems',
                desc: 'JSON stress scores on demand. <2s rescore latency. Webhook alerts on threshold breaches. IPFS verified score snapshots.',
                cta: 'View Docs',
                link: '/developers',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e84393" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                ),
                title: 'MCP Server',
                audience: 'For AI Agents',
                desc: 'Tool calls for trading bots and agent frameworks. Query risk scores before executing stablecoin positions via stdio or SSE transport.',
                cta: 'MCP Setup',
                link: '/developers#mcp-server',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                ),
                title: 'Monitoring Dashboard',
                audience: 'For Humans',
                desc: 'Live risk modeling sandbox with geographic overlays, knowledge graph visualization, and scenario projection tools.',
                cta: 'Open Dashboard',
                link: '/dashboard',
              },
            ].map((m) => (
              <div
                key={m.title}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 flex flex-col hover:border-[#6c5ce7]/30 transition-colors group"
              >
                <div className="mb-5">{m.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-1">{m.title}</h3>
                <span className="text-xs text-[#888] uppercase tracking-wider mb-4">{m.audience}</span>
                <p className="text-sm text-[#888] leading-relaxed flex-1">{m.desc}</p>
                <Link to={m.link} className="mt-6 text-sm font-medium text-[#a29bfe] hover:text-[#6c5ce7] transition-colors inline-flex items-center gap-1.5">
                  {m.cta}
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 5. PRICING TIERS ═══════════════════ */}
      <section id="pricing" className="relative py-28 px-6 md:px-16 bg-[#0e0c16]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-[#a29bfe] font-medium">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
              API First Infrastructure
            </h2>
            <p className="text-lg text-[#888]">Not a consulting fee.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-1">Starter API</h3>
              <p className="text-xs text-[#888] uppercase tracking-wider mb-6">For builders & bots</p>
              <ul className="space-y-3 text-sm text-[#aaa] flex-1">
                {['REST API access', 'MCP for AI agents', '6 stablecoins', '<2s rescore latency', 'Webhook alerts'].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-[#00b894] mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/developers" className="mt-8 w-full py-3 border border-white/10 rounded-xl text-center text-sm font-medium text-white hover:bg-white/5 transition-colors block">
                Get Started
              </Link>
            </div>

            {/* Enterprise */}
            <div className="relative bg-gradient-to-b from-[#6c5ce7]/10 to-transparent border-2 border-[#6c5ce7]/40 rounded-2xl p-8 flex flex-col shadow-lg shadow-[#6c5ce7]/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#6c5ce7] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">
                Popular
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Enterprise</h3>
              <p className="text-xs text-[#888] uppercase tracking-wider mb-6">For protocols & desks</p>
              <ul className="space-y-3 text-sm text-[#aaa] flex-1">
                {['Realtime streaming', 'IPFS verified scores', 'Multi model consensus', 'Enterprise SLA', 'Warehouse delivery'].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-[#6c5ce7] mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/developers" className="mt-8 w-full py-3 bg-[#6c5ce7] hover:bg-[#5b4cdb] rounded-xl text-center text-sm font-semibold text-white transition-colors block shadow-lg shadow-[#6c5ce7]/25">
                Contact Sales
              </Link>
            </div>

            {/* Institutional */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-1">Institutional</h3>
              <p className="text-xs text-[#888] uppercase tracking-wider mb-6">For compliance & risk</p>
              <ul className="space-y-3 text-sm text-[#aaa] flex-1">
                {['FDIC Call Report mining', 'Oracle feed integration', 'GENIUS Act compliance', 'Dedicated scoring pipeline', 'Custom SLA'].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-[#00b894] mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/developers" className="mt-8 w-full py-3 border border-white/10 rounded-xl text-center text-sm font-medium text-white hover:bg-white/5 transition-colors block">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 6. TRUSTED BY ═══════════════════ */}
      <section className="relative py-20 px-6 md:px-16 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-[#888] font-medium mb-10 text-center">Built for the protocols that matter</p>
          <LogoConveyor items={logos} speed={25} />
        </div>
      </section>

      {/* ═══════════════════ 7. CTA ═══════════════════ */}
      <section className="relative py-28 px-6 md:px-16">
        <div className="absolute inset-0 bg-gradient-to-t from-[#6c5ce7]/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start integrating today
          </h2>
          <p className="text-lg text-[#888] mb-10 max-w-xl mx-auto">
            Get API access in minutes. Scores for every major stablecoin, delivered however your systems need them.
          </p>
          <Link
            to="/developers"
            className="inline-block px-10 py-4 bg-[#6c5ce7] hover:bg-[#5b4cdb] text-white font-semibold rounded-xl transition-all shadow-xl shadow-[#6c5ce7]/25 text-base"
          >
            Get API Access
            <svg className="inline-block ml-1.5 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 px-8 md:px-16 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#555]">
        <span>© 2026 Helicity. Cornell AI Hackathon.</span>
        <div className="flex gap-6">
          <Link to="/dashboard" className="hover:text-[#888] transition-colors">Dashboard</Link>
          <Link to="/developers" className="hover:text-[#888] transition-colors">Developers</Link>
          <Link to="/portal" className="hover:text-[#888] transition-colors">API Portal</Link>
        </div>
      </footer>
    </div>
  )
}
