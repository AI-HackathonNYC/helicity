import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface SlideLayoutProps {
  children: ReactNode
  variant?: "default" | "alt" | "dark" | "hero"
  className?: string
}

export function SlideLayout({ children, variant = "default", className }: SlideLayoutProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col justify-start items-stretch gap-4 box-border overflow-hidden font-sans",
        "px-16 pt-10 pb-8 text-[19px]",
        variant === "default" && "bg-bg text-text-primary",
        variant === "alt" && "bg-bg-alt text-text-primary",
        variant === "dark" && "bg-bg-dark text-white/[0.92]",
        variant === "hero" && "bg-bg text-text-primary justify-center items-center text-center",
        className
      )}
    >
      {/* Subtle radial glow on hero */}
      {variant === "hero" && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(108,92,231,0.06) 0%, transparent 70%)"
        }} />
      )}
      {children}
    </div>
  )
}
