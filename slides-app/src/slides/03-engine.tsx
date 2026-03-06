import { motion } from "framer-motion"
import { SlideLayout } from "./slide-layout"
import { Card } from "@/components/ui/card"
import { Eyebrow } from "@/components/ui/eyebrow"
import { Badge } from "@/components/ui/badge"
import { Pipeline } from "@/components/ui/pipeline"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
})

export function SlideEngine() {
  return (
    <SlideLayout>
      <Eyebrow>Stress Engine</Eyebrow>
      <motion.h2
        className="text-[clamp(1.9rem,3vw,2.6rem)] font-bold leading-tight tracking-[-0.028em]"
        {...fadeUp(0)}
      >
        From opaque PDF to <span className="gradient-text">real-time liquidity stress score.</span>
      </motion.h2>

      <motion.div {...fadeUp(0.1)}>
        <Card className="!bg-accent/[0.07] !border-accent/[0.12]">
          <div className="text-base text-text-secondary leading-relaxed">
            Attestations say <em className="text-text-tertiary">&ldquo;US-regulated bank with $100B+ in assets&rdquo;</em> &mdash; that&apos;s an envelope, not data.
            We treat them as <strong className="text-accent">inference puzzles</strong> &mdash; cross-referencing vague disclosures against FDIC Call Reports and on-chain Mint/Burn flows to infer the actual counterparty.
          </div>
        </Card>
      </motion.div>

      <motion.div {...fadeUp(0.2)}>
        <Pipeline
          steps={[
            { num: "01", title: "Resolve Entities", description: "LLM infers counterparties from PDFs + FDIC Call Reports" },
            { num: "02", title: "Build Graph", description: "Banks \u2192 geography, LTV ratios, WAM, data center corridors" },
            { num: "03", title: "Compute WAM", description: "Weighted Average Maturity \u2014 the primary risk signal" },
            { num: "04", title: "Apply Stress", description: "Weather, rate shocks, LTV deterioration as force multipliers" },
            { num: "05", title: "Output LCR", description: "Liquidity coverage ratio + redemption latency. Not a grade." },
          ]}
        />
      </motion.div>

      <motion.div {...fadeUp(0.35)}>
        <Card>
          <div className="flex items-center gap-6 flex-wrap">
            <OutputItem label="Stress Score" value="68 / 100" accent />
            <div className="w-px bg-black/7 self-stretch" />
            <OutputItem label="Redemption Latency" value="72 hours" accent />
            <div className="w-px bg-black/7 self-stretch" />
            <OutputItem label="Liquidity Coverage" value="88%" />
            <div className="ml-auto">
              <Badge variant="consensus" dot>
                CONSENSUS &middot; Claude 68 &middot; GPT 71 &middot; &delta;=3
              </Badge>
            </div>
          </div>
        </Card>
      </motion.div>
    </SlideLayout>
  )
}

function OutputItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[0.7rem] text-text-tertiary uppercase tracking-[0.08em] font-medium">{label}</div>
      <div className={`text-base font-bold ${accent ? "text-accent" : "text-accent"}`}>{value}</div>
    </div>
  )
}
