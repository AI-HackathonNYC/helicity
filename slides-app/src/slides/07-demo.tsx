import { motion } from "framer-motion"
import { SlideLayout } from "./slide-layout"
import { Card } from "@/components/ui/card"
import { Eyebrow } from "@/components/ui/eyebrow"
import { Badge } from "@/components/ui/badge"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
})

const beats = [
  { n: 1, text: <><strong className="text-text-primary">Show dashboard.</strong> 6 stablecoins, WAM-based stress scores. &ldquo;Continuously re-scoring against OCC filings + on-chain flows.&rdquo;</> },
  { n: 2, text: <><strong className="text-text-primary">Drop hurricane.</strong> FL bank markers turn red. NoVA data center corridor lights up. &ldquo;This isn&apos;t a bank flooding &mdash; it&apos;s a liquidity squeeze.&rdquo;</> },
  { n: 3, text: <><strong className="text-text-primary">Click causal explanation.</strong> Claude + GPT agree. &ldquo;Consensus confirmed. Score 68 &middot; Latency 72h &middot; Coverage 88%.&rdquo;</> },
  { n: 4, text: <><strong className="text-text-primary">SVB backtest.</strong> WAM 730 days + rate hike. &ldquo;Our engine flags critical 48 hours before the $0.87 depeg.&rdquo;</> },
  { n: 5, text: <><strong className="text-text-primary">Close.</strong> &ldquo;Not a grade. 72h latency and 88% coverage under Cat 4 + 50bps. That&apos;s what DAOs need. That&apos;s Katabatic.&rdquo;</> },
]

const scenarios = [
  { cat: "Scenario A \u00B7 Primary Demo", title: "Hurricane \u2192 Data Center Ops Freeze", desc: "Cat 4 hits Gulf. FL bank LTV stress and Northern Virginia data center corridor simultaneously. Where treasury ops actually run.", featured: false },
  { cat: "Scenario B \u00B7 Backtest", title: "SVB Collapse \u00B7 Duration Mismatch", desc: "Rewind to March 2023. WAM chart shows 94% in 2-year bonds \u2014 already critical. Rate hike was just the match. Flagged 48h before $0.87.", featured: true },
  { cat: "Scenario C \u00B7 Sensitivity", title: "100bps Rate Hike \u2192 WAM Exposure", desc: "Slider shows which stablecoins are most duration-exposed. Score updates in <2 seconds. FRAX worst. USDT best.", featured: false },
]

const tableData = [
  { coin: "USDC", score: "68", scoreColor: "text-warn", latency: "72h", latencyColor: "text-warn", coverage: "0.88", coverageColor: "text-warn", wam: "45d" },
  { coin: "USDT", score: "31", scoreColor: "text-success", latency: "<4h", latencyColor: "text-success", coverage: "1.00", coverageColor: "text-success", wam: "12d" },
  { coin: "FRAX", score: "74", scoreColor: "text-accent", latency: "48h", latencyColor: "text-accent", coverage: "0.91", coverageColor: "text-accent", wam: "67d" },
]

export function SlideDemo() {
  return (
    <SlideLayout>
      <Eyebrow>Live Demo</Eyebrow>
      <motion.h2
        className="text-[clamp(1.9rem,3vw,2.6rem)] font-bold leading-tight tracking-[-0.028em]"
        {...fadeUp(0)}
      >
        Three scenarios. <span className="gradient-text">One engine.</span>
      </motion.h2>

      <div className="flex gap-4 items-stretch mt-3">
        {/* Left: Beats */}
        <motion.div className="flex-[1.1] flex flex-col" {...fadeUp(0.1)}>
          <Card className="flex-1 !p-5">
            <div className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-tertiary mb-2.5">
              Demo Script &middot; 5 Beats &middot; &lt;2 Min
            </div>
            {beats.map((b, i) => (
              <div key={b.n} className={`flex gap-2.5 items-start py-1.5 ${i < beats.length - 1 ? "border-b border-black/7" : ""}`}>
                <div className="w-[22px] h-[22px] rounded-md bg-accent text-white text-[0.7rem] font-bold flex items-center justify-center shrink-0">
                  {b.n}
                </div>
                <div className="text-base text-text-secondary leading-relaxed">{b.text}</div>
              </div>
            ))}
          </Card>
        </motion.div>

        {/* Right: Scenarios */}
        <div className="flex-1 flex flex-col justify-between gap-3">
          {scenarios.map((s, i) => (
            <motion.div key={s.title} {...fadeUp(0.15 + i * 0.08)}>
              <Card variant={s.featured ? "featured" : "default"}>
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-1">{s.cat}</div>
                <div className="text-[0.95rem] font-semibold text-text-primary mb-1 leading-tight">{s.title}</div>
                <div className="text-base text-text-secondary leading-relaxed">{s.desc}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Live output table */}
      <motion.div {...fadeUp(0.4)}>
        <Card className="!bg-bg-alt !p-3 !px-5 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
              Live engine output &middot; GET /api/stress-scores &middot; Cat 4 + 50bps scenario
            </div>
            <Badge variant="live" dot>LIVE</Badge>
          </div>
          <div className="grid grid-cols-5 border border-black/7 rounded-xl overflow-hidden bg-card">
            {["stablecoin", "stress_score", "latency_hours", "coverage_ratio", "wam_days"].map((col, ci) => (
              <div key={col} className={`px-3 py-2 ${ci < 4 ? "border-r border-black/7" : ""} ${ci === 0 ? "bg-black/[0.015]" : ""}`}>
                <div className="text-[0.58rem] text-text-tertiary uppercase tracking-[0.08em] mb-1">{col}</div>
                {tableData.map(row => {
                  const val = col === "stablecoin" ? row.coin : col === "stress_score" ? row.score : col === "latency_hours" ? row.latency : col === "coverage_ratio" ? row.coverage : row.wam
                  const color = col === "stablecoin" ? (row.coin === "USDC" ? "text-text-primary font-semibold" : "text-text-secondary font-semibold") :
                    col === "stress_score" ? `${row.scoreColor} font-bold` :
                    col === "latency_hours" ? `${row.latencyColor} font-semibold` :
                    col === "coverage_ratio" ? `${row.coverageColor} font-semibold` :
                    "text-text-secondary font-semibold"
                  return <div key={row.coin} className={`text-[0.88rem] leading-[1.8] ${color}`}>{val}</div>
                })}
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </SlideLayout>
  )
}
