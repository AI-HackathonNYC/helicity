import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface StatProps {
  value: string
  label: string
  description?: string
  color?: string
  className?: string
}

export function Stat({ value, label, description, color, className }: StatProps) {
  return (
    <motion.div
      className={cn("flex flex-col", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="text-[2.6rem] font-bold leading-none mb-1 tracking-tight"
        style={{ color: color || "var(--color-accent)" }}
      >
        {value}
      </div>
      <div className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
      </div>
      {description && (
        <div className="text-base text-text-secondary leading-relaxed mt-2">
          {description}
        </div>
      )}
    </motion.div>
  )
}
