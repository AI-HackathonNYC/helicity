import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "featured" | "danger" | "dark" | "glass"
}

export function Card({ className, variant = "default", children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-300",
        variant === "default" && "bg-card border border-black/7 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)]",
        variant === "featured" && "bg-gradient-to-br from-accent/[0.03] to-card border border-accent shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04),0_0_0_1px_rgba(108,92,231,0.08)]",
        variant === "danger" && "bg-accent/[0.07] border border-accent/[0.18]",
        variant === "dark" && "glass-dark rounded-2xl",
        variant === "glass" && "glass rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.07)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
