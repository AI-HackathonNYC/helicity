import { motion } from "framer-motion"
import { SlideLayout } from "./slide-layout"
import { HurricaneRings } from "@/components/ui/hurricane-rings"

import { KatabaticLogo } from "@/components/katabatic-logo"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5 },
})

export function SlideClose(_props: { subStep?: number }) {
  return (
    <SlideLayout variant="dark" className="!justify-center !items-center">
      <HurricaneRings opacity={1} />

      <motion.div
        className="relative z-10 w-full max-w-[760px] flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Heading */}
        <motion.h2
          className="text-[clamp(2.2rem,4vw,3.5rem)] font-bold leading-tight tracking-[-0.028em] text-white/[0.92] text-center mb-6"
          {...fadeUp(0.05)}
        >
          Weather proves <span className="text-accent-light">the engine.</span>
        </motion.h2>

        {/* Context line */}
        <motion.p
          className="text-[1.2rem] text-white/50 text-center leading-relaxed max-w-[560px]"
          {...fadeUp(0.26)}
        >
          <span className="text-white/80 font-medium">That&apos;s what DAO treasuries and AI agents need.</span>
          <br />
          <span className="text-white/80 font-medium inline-flex items-center gap-1 justify-center">That&apos;s <KatabaticLogo size="sm" dark />.</span>
        </motion.p>
      </motion.div>
    </SlideLayout>
  )
}
