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

export function SlideProblem() {
  return (
    <SlideLayout variant="alt">
      <Eyebrow>The Problem</Eyebrow>
      <motion.h2
        className="text-[clamp(1.9rem,3vw,2.6rem)] font-bold leading-tight tracking-[-0.028em]"
        {...fadeUp(0)}
      >
        $150B in stablecoins.
        <br />
        No <span className="gradient-text">stress testing.</span>
      </motion.h2>

      {/* SVB callout */}
      <motion.div {...fadeUp(0.1)}>
        <Card variant="danger" className="p-5">
          <div className="flex items-start gap-5 flex-wrap">
            <div className="shrink-0">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-accent/60 mb-1">
                SVB &middot; March 2023
              </div>
              <div className="text-[2.4rem] font-bold text-accent tracking-tight leading-none">$3.3B</div>
              <div className="text-base text-text-secondary mt-1">USDC reserves at Silicon Valley Bank</div>
            </div>
            <div className="flex-1 min-w-[180px]">
              <div className="text-base text-text-secondary leading-relaxed">
                Attestation said <strong className="text-text-primary">fine</strong> two weeks prior.
                <br />
                USDC depegged to <strong className="text-accent">$0.87.</strong>
                <br />
                Invisible until it wasn&apos;t.
              </div>
              <div className="mt-2">
                <Badge variant="accent">Root cause: duration mismatch &mdash; not credit risk</Badge>
              </div>
            </div>
            <div className="shrink-0 border-l border-accent/20 pl-4">
              <div className="text-[0.7rem] font-medium uppercase tracking-[0.08em] text-accent/50 mb-1">Attestation said:</div>
              <div className="text-base text-text-tertiary leading-relaxed">
                &ldquo;Held at a US-regulated
                <br />
                bank with $100B+ assets&rdquo;
              </div>
              <div className="text-base text-accent mt-1">&rarr; envelope, not data</div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 3 stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { value: "$150B+", label: "Unstressed Reserve Assets", desc: "Real banking relationships with hidden duration risk. No one models what breaks under rate shocks or weather events." },
          { value: "$3.3B", label: "USDC Held at SVB", desc: "SVB held 2-year treasuries when rates spiked \u2014 duration mismatch. A stress test would have flagged the freeze 48h early." },
          { value: "30 Days", label: "Between Attestations", desc: "Rate shocks, bank failures, hurricanes \u2014 all invisible between monthly snapshots. Zero continuous risk monitors exist today." },
        ].map((s, i) => (
          <motion.div key={s.label} {...fadeUp(0.15 + i * 0.08)}>
            <Card className="h-full">
              <div className="text-[2.6rem] font-bold leading-none mb-1 tracking-tight text-accent">{s.value}</div>
              <div className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-tertiary mb-1.5">{s.label}</div>
              <div className="text-base text-text-secondary leading-relaxed mt-2">{s.desc}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Depeg sparkline */}
      <motion.div {...fadeUp(0.4)}>
        <Card className="!py-3 !px-5 flex items-center gap-5 shrink-0">
          <div className="shrink-0">
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-1">
              USDC peg &middot; SVB collapse &middot; Mar 2023
            </div>
            <div className="text-2xl font-bold text-accent tracking-tight leading-tight">$1.00 &rarr; $0.87</div>
            <div className="text-[0.72rem] text-text-tertiary mt-0.5">&minus;13&cent; in 48 hours</div>
          </div>
          <div className="flex-1 relative h-[54px]">
            <svg width="100%" height="54" viewBox="0 0 400 54" preserveAspectRatio="none" className="overflow-visible">
              <defs>
                <linearGradient id="dg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(108,92,231,0.13)" />
                  <stop offset="100%" stopColor="rgba(108,92,231,0)" />
                </linearGradient>
              </defs>
              <line x1="0" y1="4" x2="400" y2="4" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
              <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
              <polygon
                points="0,4 230,4 270,15 310,50 350,37 400,14 400,54 0,54"
                fill="url(#dg1)"
                className="svg-fade-in"
                style={{ animationDelay: "1.8s" }}
              />
              <polyline
                className="depeg-line"
                points="0,4 230,4 270,15 310,50 350,37 400,14"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-warn border-2 border-white -translate-x-1/2 -translate-y-1/2 svg-fade-in"
                style={{ left: "67.5%", top: "27.8%", animationDelay: "1.5s" }}
              />
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-accent border-2 border-white -translate-x-1/2 -translate-y-1/2 svg-fade-in"
                style={{ left: "77.5%", top: "92.6%", animationDelay: "2s" }}
              />
              <div className="absolute text-[0.6rem] text-warn font-semibold whitespace-nowrap svg-fade-in" style={{ top: "8px", left: "69%", animationDelay: "1.5s" }}>
                SVB fails
              </div>
              <div className="absolute text-[0.6rem] text-accent font-semibold whitespace-nowrap svg-fade-in" style={{ top: "30px", left: "79%", animationDelay: "2s" }}>
                $0.87 low
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right border-l border-black/7 pl-4">
            <div className="text-[0.72rem] font-semibold text-accent">Katabatic</div>
            <div className="text-[0.72rem] text-text-tertiary">flags critical</div>
            <div className="text-[0.72rem] text-text-primary font-semibold">48h prior</div>
          </div>
        </Card>
      </motion.div>
    </SlideLayout>
  )
}
