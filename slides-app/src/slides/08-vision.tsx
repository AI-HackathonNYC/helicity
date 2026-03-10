import { motion } from "framer-motion"
import { SlideLayout } from "./slide-layout"
import { Eyebrow } from "@/components/ui/eyebrow"
import { Badge } from "@/components/ui/badge"
import { KatabaticLogo } from "@/components/katabatic-logo"

const base = import.meta.env.BASE_URL

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
})

const phases = [
  {
    num: "01",
    label: "Now",
    labelColor: "text-text-tertiary",
    title: "Stress Test Playground",
    badge: <Badge variant="accent">IPFS verified &middot; MCP for AI agents &middot; Chainlink ready</Badge>,
    featured: false,
    bg: false,
  },
  {
    num: "02",
    label: "Next",
    labelColor: "text-white/70",
    title: "Oracle Grade Risk Feed",
    badge: <Badge variant="consensus" dot>Enterprise API &middot; Streaming &middot; TEE execution</Badge>,
    featured: true,
    bg: true,
  },
  {
    num: "03",
    label: "Endgame",
    labelColor: "text-text-tertiary",
    title: null as React.ReactNode,
    titleComponent: true,
    badge: <Badge variant="accent">The system of record for stablecoin reserve risk</Badge>,
    featured: false,
    bg: false,
  },
]

export function SlideVision(_props: { subStep?: number }) {
  return (
    <SlideLayout variant="alt">
      <Eyebrow>Future Vision</Eyebrow>
      <motion.h2
        className="text-[clamp(1.9rem,3vw,2.6rem)] font-bold leading-tight tracking-[-0.028em]"
        {...fadeUp(0)}
      >
        From stress simulator to <span className="gradient-text">financial infrastructure.</span>
      </motion.h2>

      {/* Phases — horizontal pipeline style with connecting line */}
      <div className="relative flex-[1.5] flex flex-col">
        {/* Connecting line behind the numbers — grows from left */}
        <motion.div
          className="absolute top-[32px] left-[36px] right-[36px] h-px bg-accent/15 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
        />

        <div className="grid grid-cols-3 gap-5 flex-1">
          {phases.map((p, i) => (
            <motion.div
              key={i}
              className={`relative overflow-hidden flex flex-col ${
                p.featured
                  ? "-mx-2 px-6 py-6 rounded-xl border border-accent/10"
                  : "py-6"
              }`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.2, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Background image for featured phase */}
              {p.bg && (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${base}oracle-bg.jpg)` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
                </>
              )}

              {/* Phase number on the line */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold relative z-10 mb-5 ${
                p.featured
                  ? "bg-accent text-white shadow-[0_0_16px_rgba(108,92,231,0.3)]"
                  : "bg-bg-alt border border-black/10 text-text-secondary"
              }`}>
                {p.num}
              </div>

              <div className={`relative z-10 text-[0.85rem] font-semibold uppercase tracking-[0.1em] mb-2.5 ${p.labelColor}`}>
                Phase {p.num} &middot; {p.label}
              </div>
              <div className={`relative z-10 text-[1.3rem] font-semibold ${p.featured ? "text-white" : "text-text-primary"}`}>
                {(p as any).titleComponent ? (
                  <span className="flex items-center gap-1">The <KatabaticLogo size="sm" /> Stablecoin</span>
                ) : p.title}
              </div>
              {p.badge && <div className="relative z-10 mt-auto pt-4">{p.badge}</div>}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom section — centered in remaining space below phases */}
      <div className="flex-1 flex items-center">
        <motion.div className="bg-bg-dark rounded-2xl p-6 flex gap-10 items-center w-full" {...fadeUp(0.35)}>
          {/* Bloomberg quote */}
          <div className="flex-1 relative pl-6">
            <span className="absolute top-[-8px] left-0 text-[3.5rem] leading-none text-accent-light/15 font-serif pointer-events-none select-none">
              &ldquo;
            </span>
            <div className="text-[1.05rem] text-white/50 leading-relaxed italic">
              Bloomberg started with terminals.<br />We start with stress simulations.
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-16 bg-white/[0.08]" />

          {/* WAM comparison bars */}
          <div className="flex-1">
            <div className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-white/30 mb-3">
              WAM Duration &middot; Healthy vs SVB
            </div>
            <div className="flex flex-col gap-3">
              {[
                { name: "USDC", width: "6%", color: "bg-success", days: "45d", dayColor: "text-success", delay: 0.3 },
                { name: "SVB 2023", width: "100%", color: "bg-accent-light", days: "2,040d", dayColor: "text-accent-light", delay: 0.55 },
              ].map(bar => (
                <div key={bar.name} className="flex items-center gap-3">
                  <div className="text-[0.85rem] text-white/50 w-[72px] text-right font-medium shrink-0">{bar.name}</div>
                  <div className="flex-1 h-7 bg-white/[0.06] rounded overflow-hidden">
                    <div
                      className={`h-full ${bar.color} rounded origin-left`}
                      style={{
                        width: bar.width,
                        transform: "scaleX(0)",
                        animation: `bar-grow 0.6s ease-out forwards ${bar.delay}s`,
                      }}
                    />
                  </div>
                  <div className={`text-[0.85rem] font-bold shrink-0 w-[48px] text-right ${bar.dayColor}`}>{bar.days}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

    </SlideLayout>
  )
}
