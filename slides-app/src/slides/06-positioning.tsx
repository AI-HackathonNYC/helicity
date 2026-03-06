import { motion } from "framer-motion"
import { SlideLayout } from "./slide-layout"
import { Card } from "@/components/ui/card"
import { Eyebrow } from "@/components/ui/eyebrow"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
})

const Dot = ({ color = "accent" }: { color?: string }) => (
  <span className={`w-1.5 h-1.5 rounded-full bg-${color} shrink-0 inline-block mt-1`} />
)

export function SlidePositioning() {
  return (
    <SlideLayout variant="alt">
      <Eyebrow>Positioning</Eyebrow>
      <motion.h2
        className="text-[clamp(1.9rem,3vw,2.6rem)] font-bold leading-tight tracking-[-0.028em]"
        {...fadeUp(0)}
      >
        On-chain shows the flows.
        <br />
        Katabatic shows <span className="gradient-text">what&apos;s about to break.</span>
      </motion.h2>

      {/* 3 layer cards */}
      <div className="grid grid-cols-3 gap-4 mt-3 mb-4">
        {[
          {
            num: "Layer 1",
            numClass: "text-text-tertiary",
            title: "On-Chain Data Platforms",
            desc: "Mint/burn flows, wallet balances, transaction history. Authoritative for on-chain behavior.",
            tags: ["Dune", "Nansen", "Chainalysis"],
            tagClass: "bg-bg-alt text-text-secondary",
            featured: false,
          },
          {
            num: "\u2605 Layer 2 \u2014 Katabatic",
            numClass: "text-accent",
            title: "Reserve Risk Infrastructure",
            desc: "WAM duration risk, FDIC health, weather tail-risk, LLM consensus. The structural fragility layer on-chain can\u2019t see.",
            tags: ["stress_score", "latency_hours", "coverage_ratio"],
            tagClass: "bg-accent/[0.07] text-accent",
            featured: true,
          },
          {
            num: "Layer 3",
            numClass: "text-text-tertiary",
            title: "Downstream Consumers",
            desc: "DAO governance contracts, DeFi protocol rebalancing, institutional risk desks, Chainlink oracle feeds.",
            tags: ["MakerDAO", "Aave", "Risk Desks"],
            tagClass: "bg-bg-alt text-text-secondary",
            featured: false,
          },
        ].map((layer, i) => (
          <motion.div key={layer.title} {...fadeUp(0.1 + i * 0.08)}>
            <Card variant={layer.featured ? "featured" : "default"} className="h-full !p-4">
              <div className={`text-[0.7rem] font-semibold uppercase tracking-[0.1em] mb-1 ${layer.numClass}`}>{layer.num}</div>
              <div className="text-[0.95rem] font-semibold text-text-primary mb-1">{layer.title}</div>
              <div className="text-base text-text-secondary leading-relaxed">{layer.desc}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {layer.tags.map(t => (
                  <span key={t} className={`text-xs font-medium rounded-md px-2 py-0.5 ${layer.tagClass}`}>{t}</span>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Dark analogy + business model */}
      <motion.div
        className="bg-bg-dark rounded-2xl p-5 flex gap-5 items-start"
        {...fadeUp(0.35)}
      >
        <div className="flex-[1.3] border-r border-white/[0.09] pr-5">
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-accent-light mb-2">The Analogy</div>
          <div className="text-base text-white/[0.92] leading-relaxed mb-1.5">
            On-chain data platforms became the system of record for what&apos;s happening on-chain &mdash; the data layer Visa and a16z integrate into their own systems.
          </div>
          <div className="text-base text-white/55 leading-relaxed">
            The GENIUS Act is creating the same unlock for off-chain reserve data. We are first to build the infrastructure layer above it.
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <div className="glass-dark rounded-xl p-3">
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-accent-light mb-1">Business Model</div>
            <div className="text-base text-white/55 leading-relaxed">API-first &middot; Enterprise contracts<br />Warehouse delivery &middot; Real-time streaming</div>
          </div>
          <div className="glass-dark rounded-xl p-3">
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-accent-light mb-1.5">Defensible Moat</div>
            <div className="flex flex-col gap-0.5">
              {["WAM duration scoring engine", "Geo knowledge graph + DC ops risk", "Multi-model LLM consensus oracle layer"].map(t => (
                <div key={t} className="flex items-center gap-2 py-0.5">
                  <Dot color="accent-light" />
                  <span className="text-base text-white/55">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </SlideLayout>
  )
}
