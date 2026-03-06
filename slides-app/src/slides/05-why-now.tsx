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
  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 inline-block mt-1" />
)

export function SlideWhyNow() {
  return (
    <SlideLayout>
      <Eyebrow>Why Now</Eyebrow>
      <motion.h2
        className="text-[clamp(1.9rem,3vw,2.6rem)] font-bold leading-tight tracking-[-0.028em]"
        {...fadeUp(0)}
      >
        The GENIUS Act 2026
        <br />
        just <span className="gradient-text">created this market.</span>
      </motion.h2>

      <div className="flex gap-4 items-start mt-3">
        {/* Left: Timeline */}
        <motion.div className="flex-[1.3] flex flex-col gap-3" {...fadeUp(0.1)}>
          <Card>
            <div className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-tertiary mb-2">Regulatory Timeline</div>
            <div className="flex flex-col">
              {[
                { dot: "border", date: "Before 2026", text: <><strong className="text-text-primary">PDF attestations.</strong> 30-day lag. No programmatic access. Continuous monitoring was technically impossible.</> },
                { dot: "active", date: "Jan 2026", text: <><strong className="text-text-primary">GENIUS Act signed.</strong> All PPSIs must provide XBRL filings + OCC-standardized API feeds. Programmatic ingest is now mandated.</> },
                { dot: "done", date: "Today", text: <><strong className="text-text-primary">We have the pipeline.</strong> First time in history that real-time reserve stress monitoring is technically and legally possible.</> },
              ].map((item, i) => (
                <div key={i} className={`flex gap-3.5 items-start py-2.5 ${i < 2 ? "border-b border-black/7" : ""}`}>
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 border-2 ${
                    item.dot === "active" ? "border-accent bg-accent" :
                    item.dot === "done" ? "border-success bg-success" :
                    "border-accent"
                  }`} />
                  <div className="text-[0.7rem] text-text-tertiary min-w-[72px] font-medium pt-0.5">{item.date}</div>
                  <div className="text-base text-text-secondary leading-relaxed">{item.text}</div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Right: Why + stats */}
        <div className="flex-1 flex flex-col gap-3">
          <motion.div {...fadeUp(0.2)}>
            <Card variant="featured">
              <div className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-accent mb-2">Why hasn&apos;t someone done this before?</div>
              <div className="text-base text-text-primary leading-relaxed mb-2.5">
                The data didn&apos;t exist.
                <br />
                <span className="text-accent font-semibold">Now it does.</span>
                <br />
                We&apos;re first in a regulation-mandated market.
              </div>
              <div className="flex flex-col gap-1">
                {[
                  "GENIUS Act mandates XBRL feeds for all US PPSIs",
                  "OCC APIs enable real-time programmatic ingest",
                  "On-chain Mint/Burn cross-reference now automatable",
                  "Multi-model LLM for qualitative signal extraction",
                ].map(t => (
                  <div key={t} className="flex items-center gap-2 py-1">
                    <Dot />
                    <span className="text-base text-text-secondary">{t}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div className="grid grid-cols-2 gap-2.5" {...fadeUp(0.3)}>
            <Card className="text-center !py-3.5 !px-2.5">
              <div className="text-[2rem] font-bold text-accent leading-none">6</div>
              <div className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-tertiary mt-1">Stablecoins tracked</div>
            </Card>
            <Card className="text-center !py-3.5 !px-2.5">
              <div className="text-[2rem] font-bold text-accent leading-none">&lt;2s</div>
              <div className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-tertiary mt-1">Re-score time</div>
            </Card>
          </motion.div>
        </div>
      </div>
    </SlideLayout>
  )
}
