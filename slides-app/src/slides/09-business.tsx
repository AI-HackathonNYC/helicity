import { motion } from "framer-motion"
import { SlideLayout } from "./slide-layout"
import { Card } from "@/components/ui/card"
import { Eyebrow } from "@/components/ui/eyebrow"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
})

const Dot = () => (
  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 inline-block" />
)

export function SlideBusiness() {
  return (
    <SlideLayout>
      <Eyebrow>Business Model</Eyebrow>
      <motion.h2
        className="text-[clamp(1.9rem,3vw,2.6rem)] font-bold leading-tight tracking-[-0.028em]"
        {...fadeUp(0)}
      >
        Infrastructure pricing.
        <br />
        Not a <span className="gradient-text">consulting fee.</span>
      </motion.h2>

      <div className="flex gap-4 items-start mt-3">
        {/* Left: 3 pricing tiers */}
        <div className="flex-[1.4] flex flex-col gap-3">
          {[
            { tier: "Starter API", tierColor: "text-text-tertiary", price: "$500", period: "/mo", desc: "REST API access \u00B7 6 stablecoins \u00B7 <2s re-score \u00B7 1M calls/mo", featured: false },
            { tier: "Enterprise", tierColor: "text-accent", price: "$5K", period: "/mo", desc: "Real-time streaming \u00B7 custom stablecoin onboarding \u00B7 SLA \u00B7 warehouse delivery", featured: true },
            { tier: "Institutional", tierColor: "text-text-tertiary", price: "Custom", period: "", desc: "FDIC Call Report mining \u00B7 oracle feed integration \u00B7 dedicated scoring pipeline", featured: false },
          ].map((t, i) => (
            <motion.div key={t.tier} {...fadeUp(0.1 + i * 0.08)}>
              <Card variant={t.featured ? "featured" : "default"} className="!p-4 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[0.7rem] font-semibold uppercase tracking-[0.1em] ${t.tierColor}`}>{t.tier}</span>
                  <span className="text-lg font-bold text-accent tracking-tight">
                    {t.price}
                    {t.period && <span className="text-[0.7rem] font-normal text-text-tertiary">{t.period}</span>}
                  </span>
                </div>
                <div className="text-base text-text-secondary leading-relaxed">{t.desc}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Right: Customers + Moat */}
        <div className="flex-1 flex flex-col gap-3">
          <motion.div {...fadeUp(0.2)}>
            <Card className="!p-4">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-2">Target Customers</div>
              <div className="flex flex-col gap-1.5">
                {[
                  "DAO Treasuries \u2014 MakerDAO, Aave, Compound",
                  "DeFi Protocols holding stablecoin positions",
                  "Institutional Risk Desks",
                  "Stablecoin Issuers \u2014 GENIUS Act compliance",
                ].map(c => (
                  <div key={c} className="flex items-center gap-2 text-base text-text-secondary"><Dot />{c}</div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div {...fadeUp(0.3)}>
            <Card className="!p-4">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-2">Moat</div>
              <div className="flex flex-col gap-1.5">
                {[
                  "First-mover on GENIUS Act data pipeline",
                  "Proprietary WAM duration engine",
                  "Multi-model LLM consensus layer",
                  "Oracle-grade signal (Chainlink-ready)",
                ].map(m => (
                  <div key={m} className="flex items-center gap-2 text-base text-text-secondary"><Dot />{m}</div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Market growth chart */}
      <motion.div {...fadeUp(0.4)}>
        <Card className="!py-4 !px-6 shrink-0">
          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-2.5">
            Stablecoin total supply &mdash; TAM &middot; GENIUS Act creates continuous monitoring market
          </div>
          <div className="flex items-end gap-2 h-[62px]">
            {[
              { h: 14, opacity: 0.3, delay: 0.2 },
              { h: 30, opacity: 0.5, delay: 0.4 },
              { h: 46, opacity: 0.72, delay: 0.6 },
              { h: 62, opacity: 1, delay: 0.8 },
            ].map((bar, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm origin-bottom"
                style={{
                  height: bar.h,
                  background: bar.opacity === 1 ? "var(--color-accent)" : `rgba(108,92,231,${bar.opacity})`,
                  transform: "scaleY(0)",
                  animation: `bar-grow-y 0.75s cubic-bezier(0.34,1.56,0.64,1) forwards ${bar.delay}s`,
                }}
              />
            ))}
            <div className="shrink-0 w-px bg-black/7 h-[62px] mx-1" />
            <div
              className="flex-[1.3] h-[62px] rounded-t-sm flex items-center justify-center origin-bottom"
              style={{
                background: "repeating-linear-gradient(45deg,rgba(108,92,231,0.07) 0px,rgba(108,92,231,0.07) 4px,transparent 4px,transparent 10px)",
                border: "1.5px dashed rgba(108,92,231,0.3)",
                transform: "scaleY(0)",
                animation: "bar-grow-y 0.75s cubic-bezier(0.34,1.56,0.64,1) forwards 1s",
              }}
            >
              <span className="text-[0.65rem] font-bold text-accent tracking-wider">projected</span>
            </div>
          </div>
          <div className="flex gap-2 mt-1.5">
            {[
              { val: "$30B", year: "2021" },
              { val: "$80B", year: "2023" },
              { val: "$150B", year: "2025" },
              { val: "$500B", year: "2027", accent: true },
            ].map(d => (
              <div key={d.year} className="flex-1 text-center text-[0.68rem]">
                <strong className={d.accent ? "text-accent" : "text-text-secondary"}>{d.val}</strong>
                <br />
                <span className="text-text-tertiary">{d.year}</span>
              </div>
            ))}
            <div className="shrink-0 w-2.5" />
            <div className="flex-[1.3] text-center text-[0.68rem]">
              <strong className="text-accent">$1T+</strong>
              <br />
              <span className="text-accent text-[0.62rem]">2030 proj.</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </SlideLayout>
  )
}
