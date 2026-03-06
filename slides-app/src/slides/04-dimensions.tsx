import { motion } from "framer-motion"
import { SlideLayout } from "./slide-layout"
import { Card } from "@/components/ui/card"
import { Eyebrow } from "@/components/ui/eyebrow"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
})

const dimensions = [
  { weight: "30% \u00B7 Primary", title: "Duration Risk (WAM)", desc: "Weighted Average Maturity of treasury portfolio. SVB: 730-day WAM vs daily redemptions \u2014 critical mismatch flagged 48h early.", featured: true },
  { weight: "20%", title: "Reserve Transparency", desc: "XBRL/OCC feed freshness + Mint/Burn cross-reference divergence. Probabilistic entity resolver: BNY Mellon, 92% confidence.", featured: false },
  { weight: "15%", title: "Geographic + Ops Concentration", desc: "HHI of bank locations + data center corridor overlap. AWS us-east-1 (NoVA) as treasury ops risk node.", featured: false },
  { weight: "15% \u00B7 Demo Focus", title: "Weather Tail-Risk Multiplier", desc: "Storm track \u00D7 bank LTV exposure (FDIC Call Reports). The hurricane doesn\u2019t hit the bank \u2014 it hits the LTV ratio.", featured: true },
  { weight: "15%", title: "Counterparty Health", desc: "FDIC watch list status, LTV ratios, liquidity coverage. Multi-model LLM jury: Claude + GPT average, flag if delta >15.", featured: false },
  { weight: "5%", title: "Peg Stability", desc: "Historical depeg events, current spread, Mint/Burn velocity. Lagging signal \u2014 the other 95% is structural.", featured: false },
]

export function SlideDimensions() {
  return (
    <SlideLayout variant="alt">
      <Eyebrow>Six Dimensions of Risk</Eyebrow>
      <motion.h2
        className="text-[clamp(1.9rem,3vw,2.6rem)] font-bold leading-tight tracking-[-0.028em]"
        {...fadeUp(0)}
      >
        Duration risk is primary. Weather is the <span className="gradient-text">force multiplier.</span>
      </motion.h2>

      {/* Formula */}
      <motion.div
        className="bg-accent/[0.07] border border-accent/[0.12] rounded-2xl px-5 py-3 text-sm text-text-secondary leading-relaxed mt-2"
        {...fadeUp(0.1)}
      >
        <span className="text-accent font-medium">Stress Score</span>
        <span className="text-text-tertiary"> = </span>
        <span className="text-accent font-medium">Duration Risk</span>
        <sup className="text-[0.6em] text-text-tertiary">WAM</sup>
        <span className="text-text-tertiary"> &times; </span>
        <span className="text-accent font-medium">Weather Multiplier</span>
        <span className="text-text-tertiary"> &times; </span>
        <span className="text-accent font-medium">Concentration Factor</span>
      </motion.div>

      {/* 6 dimension cards */}
      <div className="grid grid-cols-3 grid-rows-2 gap-4 mt-2">
        {dimensions.map((d, i) => (
          <motion.div key={d.title} {...fadeUp(0.15 + i * 0.06)}>
            <Card variant={d.featured ? "featured" : "default"} className="h-full !p-5">
              <div className={`inline-block text-[0.7rem] font-semibold rounded-md px-2 py-0.5 mb-1.5 ${d.featured ? "text-accent bg-accent/10" : "text-accent bg-accent/[0.07]"}`}>
                {d.weight}
              </div>
              <div className="text-[0.95rem] font-semibold text-text-primary mb-1">{d.title}</div>
              <div className="text-base text-text-secondary leading-relaxed">{d.desc}</div>
            </Card>
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  )
}
