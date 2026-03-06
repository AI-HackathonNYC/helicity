import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "live" | "consensus" | "accent"
  dot?: boolean
}

export function Badge({ className, variant = "default", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium tracking-wide",
        variant === "default" && "bg-accent/[0.07] text-accent",
        variant === "live" && "bg-success/[0.08] text-success border border-success/20",
        variant === "consensus" && "bg-success/[0.08] text-success border border-success/20",
        variant === "accent" && "bg-accent/[0.07] text-accent",
        className
      )}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" />
      )}
      {children}
    </span>
  )
}
