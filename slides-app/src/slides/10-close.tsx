import { motion } from "framer-motion"
import { SlideLayout } from "./slide-layout"
import { HurricaneRings } from "@/components/ui/hurricane-rings"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5 },
})

const Dot = () => (
  <span className="w-1.5 h-1.5 rounded-full bg-accent-light shrink-0 inline-block" />
)

export function SlideClose() {
  return (
    <SlideLayout variant="dark" className="!justify-center !items-center">
      <HurricaneRings opacity={1} />

      <motion.div
        className="relative z-10 w-full max-w-[680px] flex flex-col gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Heading */}
        <motion.div className="text-center mb-1" {...fadeUp(0)}>
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-accent-light/70 flex items-center justify-center gap-2 mb-3.5">
            <span className="inline-block w-5 h-0.5 bg-accent-light/50 rounded-full" />
            The Close
            <span className="inline-block w-5 h-0.5 bg-accent-light/50 rounded-full" />
          </div>
          <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-bold leading-tight tracking-[-0.028em] text-white/[0.92] mb-3">
            Weather proves
            <br />
            <span className="text-accent-light">the engine.</span>
          </h2>
          <p className="text-base text-white/75 leading-relaxed mx-auto">
            This is the difference between a rating agency and a risk engine.
            <br />
            We don&apos;t give you a letter grade you can get sued over.
          </p>
        </motion.div>

        {/* Quote card */}
        <motion.div
          className="glass-dark rounded-2xl p-5"
          {...fadeUp(0.2)}
        >
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-accent-light mb-2.5">We give you:</div>
          <div className="text-base text-white/[0.92] leading-relaxed">
            &ldquo;Under a Cat 4 hitting the Gulf + 50bps rate hike, your USDC position shows{" "}
            <span className="text-accent-light font-semibold">72-hour redemption latency</span> and{" "}
            <span className="text-accent-light font-semibold">88% liquidity coverage.</span>&rdquo;
          </div>
          <div className="mt-2.5 text-[0.875rem] text-white/55">
            That&apos;s what DAO treasuries and DeFi protocols need to make capital decisions. That&apos;s Katabatic.
          </div>
        </motion.div>

        {/* We're looking for */}
        <motion.div
          className="rounded-2xl p-4 px-5"
          style={{
            background: "rgba(108,92,231,0.12)",
            border: "1px solid rgba(108,92,231,0.25)",
          }}
          {...fadeUp(0.35)}
        >
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-accent-light mb-2.5">We&apos;re Looking For</div>
          <div className="flex flex-col gap-2">
            {[
              "Pilot DAO treasuries (MakerDAO, Aave, Compound)",
              "Advisors in DeFi risk + regulatory data infrastructure",
              "Institutional data contracts (risk desks, stablecoin issuers)",
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <Dot />
                <span className="text-[0.95rem] text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </SlideLayout>
  )
}
