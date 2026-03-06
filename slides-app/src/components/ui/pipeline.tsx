import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface PipelineStep {
  num: string
  title: string
  description: string
}

interface PipelineProps {
  steps: PipelineStep[]
  className?: string
}

export function Pipeline({ steps, className }: PipelineProps) {
  return (
    <div className={cn("grid gap-0 relative", className)} style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
      {/* Connection line */}
      <div className="absolute top-[25px] left-[10%] right-[10%] h-px bg-gradient-to-r from-accent/[0.05] via-accent/20 to-accent/[0.05]" />

      {steps.map((step, i) => (
        <motion.div
          key={step.num}
          className="flex flex-col items-center text-center px-2 relative"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <div className="w-[50px] h-[50px] rounded-full bg-accent text-white text-sm font-semibold flex items-center justify-center mb-3 relative z-10 shadow-[0_0_0_4px_var(--color-bg)]">
            {step.num}
          </div>
          <div className="text-base font-semibold text-text-primary mb-1 leading-tight">
            {step.title}
          </div>
          <div className="text-base text-text-secondary leading-relaxed">
            {step.description}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
