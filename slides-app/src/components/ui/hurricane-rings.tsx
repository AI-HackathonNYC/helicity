import { cn } from "@/lib/utils"

interface HurricaneRingsProps {
  className?: string
  opacity?: number
}

export function HurricaneRings({ className, opacity = 0.85 }: HurricaneRingsProps) {
  return (
    <div className={cn("absolute top-1/2 left-1/2 w-0 h-0 pointer-events-none z-0", className)} style={{ opacity }}>
      {/* Ring 1 */}
      <div
        className="absolute rounded-full w-[760px] h-[760px] -ml-[380px] -mt-[380px]"
        style={{
          background: `conic-gradient(from 0deg,
            transparent 0%, rgba(108,92,231,0.045) 8%, transparent 17%,
            rgba(72,52,212,0.03) 32%, transparent 43%,
            rgba(108,92,231,0.04) 57%, transparent 68%,
            rgba(72,52,212,0.03) 82%, transparent 93%)`,
          animation: "spin-ccw 30s linear infinite",
        }}
      />
      {/* Ring 2 */}
      <div
        className="absolute rounded-full w-[560px] h-[560px] -ml-[280px] -mt-[280px]"
        style={{
          background: `conic-gradient(from 50deg,
            transparent 0%, rgba(162,155,254,0.08) 10%, transparent 22%,
            rgba(72,52,212,0.07) 39%, transparent 51%,
            rgba(162,155,254,0.08) 67%, transparent 79%,
            rgba(72,52,212,0.06) 91%, transparent 100%)`,
          animation: "spin-cw 20s linear infinite",
        }}
      />
      {/* Ring 3 */}
      <div
        className="absolute rounded-full w-[390px] h-[390px] -ml-[195px] -mt-[195px]"
        style={{
          background: `conic-gradient(from 105deg,
            transparent 0%, rgba(162,155,254,0.15) 13%, transparent 27%,
            rgba(162,155,254,0.12) 47%, transparent 61%,
            rgba(162,155,254,0.14) 79%, transparent 93%)`,
          animation: "spin-ccw 13s linear infinite",
        }}
      />
      {/* Ring 4 */}
      <div
        className="absolute rounded-full w-[245px] h-[245px] -ml-[122px] -mt-[122px]"
        style={{
          background: `conic-gradient(from 195deg,
            rgba(162,155,254,0.22) 0%, rgba(162,155,254,0.28) 28%, transparent 58%,
            rgba(162,155,254,0.20) 52%, rgba(162,155,254,0.25) 64%, transparent 78%,
            transparent 100%)`,
          animation: "spin-cw 8s linear infinite",
        }}
      />
      {/* Ring 5 - innermost */}
      <div
        className="absolute rounded-full w-[146px] h-[146px] -ml-[73px] -mt-[73px]"
        style={{
          background: `conic-gradient(from 0deg,
            rgba(162,155,254,0.48) 0%, rgba(162,155,254,0.63) 44%, transparent 61%,
            rgba(162,155,254,0.44) 78%, rgba(162,155,254,0.55) 94%, transparent 100%)`,
          animation: "spin-ccw 4.5s linear infinite",
          boxShadow: "0 0 60px rgba(108,92,231,0.45), 0 0 120px rgba(108,92,231,0.18)",
        }}
      />
      {/* Eye */}
      <div
        className="absolute w-[54px] h-[54px] rounded-full -ml-[27px] -mt-[27px]"
        style={{
          background: "radial-gradient(circle, rgba(162,155,254,0.35) 0%, rgba(108,92,231,0.14) 55%, transparent 100%)",
          animation: "eye-pulse 2.8s ease-in-out infinite",
          boxShadow: "0 0 30px rgba(162,155,254,0.6), 0 0 60px rgba(108,92,231,0.3)",
        }}
      />
    </div>
  )
}
