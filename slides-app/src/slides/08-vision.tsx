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

export function SlideVision() {
  return (
    <SlideLayout variant="alt">
      <Eyebrow>Future Vision</Eyebrow>
      <motion.h2
        className="text-[clamp(1.9rem,3vw,2.6rem)] font-bold leading-tight tracking-[-0.028em]"
        {...fadeUp(0)}
      >
        From stress simulator to <span className="gradient-text">financial infrastructure.</span>
      </motion.h2>

      {/* 3 phases */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Phase 1 \u00B7 Now", labelColor: "text-text-tertiary",
            title: "Stress-Test Playground",
            desc: "Prove the engine: duration mismatch as the primary signal, weather as the tail-risk multiplier, LLM jury for consensus. Output: LCR + redemption latency under any scenario.",
            badge: <Badge variant="accent">Output \u2192 latency + coverage under scenario</Badge>,
            featured: false,
          },
          {
            label: "Phase 2 \u00B7 Next", labelColor: "text-accent",
            title: "Oracle-Grade Risk Feed",
            desc: "Multi-model consensus signals pushed to Chainlink oracles inside TEEs. DeFi protocols auto-rebalance stablecoin positions when stress thresholds are crossed.",
            badge: <Badge variant="consensus" dot>Multi-SIG for AI \u00B7 Chainlink-ready</Badge>,
            featured: true,
          },
          {
            label: "Phase 3 \u00B7 Endgame", labelColor: "text-text-tertiary",
            title: "The Katabatic Stablecoin",
            desc: "Use our own risk intelligence to design a stablecoin with optimal reserve structure \u2014 diversified counterparties, continuously stress-tested, managed by the engine that rates them all.",
            badge: null,
            featured: false,
          },
        ].map((p, i) => (
          <motion.div key={p.title} {...fadeUp(0.1 + i * 0.08)}>
            <Card variant={p.featured ? "featured" : "default"} className="h-full">
              <div className={`text-[0.7rem] font-semibold uppercase tracking-[0.1em] mb-2 ${p.labelColor}`}>{p.label}</div>
              <div className="text-[0.95rem] font-semibold text-text-primary mb-2">{p.title}</div>
              <div className="text-base text-text-secondary leading-relaxed">{p.desc}</div>
              {p.badge && <div className="mt-1.5">{p.badge}</div>}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bloomberg quote */}
      <motion.div {...fadeUp(0.35)}>
        <Card className="text-center !py-2.5 !px-5">
          <div className="text-base text-text-tertiary leading-relaxed">
            &ldquo;Bloomberg started with data terminals and became financial infrastructure.
            <br />
            We start with stress simulations and become the most transparent stablecoin in crypto.&rdquo;
          </div>
        </Card>
      </motion.div>

      {/* WAM comparison bars */}
      <motion.div {...fadeUp(0.4)}>
        <Card className="!py-4 !px-6 shrink-0">
          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-2.5">
            WAM duration &middot; the root cause signal &middot; healthy reserve vs SVB failure
          </div>
          <div className="flex flex-col gap-2">
            {[
              { name: "USDC", width: "6.2%", color: "bg-success", days: "45d", dayColor: "text-success", note: "safe \u00B7 daily redemptions matched", delay: 0.3 },
              { name: "SVB 2023", width: "100%", color: "bg-accent", days: "730d", dayColor: "text-accent", note: "critical \u00B7 2-yr bonds vs daily redemptions", delay: 0.55 },
            ].map(bar => (
              <div key={bar.name} className="flex items-center gap-3">
                <div className="text-xs text-text-secondary min-w-[68px] text-right font-medium">{bar.name}</div>
                <div className="flex-1 h-5 bg-bg-alt rounded overflow-hidden">
                  <div
                    className={`h-full ${bar.color} rounded origin-left`}
                    style={{
                      width: bar.width,
                      transform: "scaleX(0)",
                      animation: `bar-grow 0.6s ease-out forwards ${bar.delay}s`,
                    }}
                  />
                </div>
                <div className={`text-xs font-bold min-w-[36px] ${bar.dayColor}`}>{bar.days}</div>
                <div className={`text-[0.65rem] ${bar.dayColor === "text-accent" ? "text-accent font-semibold" : "text-text-tertiary italic"}`}>{bar.note}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[0.7rem] text-text-tertiary">
            Katabatic computes WAM continuously &mdash; flagged SVB critical 48h before the $0.87 depeg.
          </div>
        </Card>
      </motion.div>
    </SlideLayout>
  )
}
