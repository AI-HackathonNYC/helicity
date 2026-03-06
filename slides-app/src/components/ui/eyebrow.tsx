import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

export function Eyebrow({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-accent",
        className
      )}
      {...props}
    >
      <span className="inline-block w-5 h-0.5 bg-accent rounded-full" />
      {children}
    </div>
  )
}
