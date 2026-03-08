// Add global property to window for cursor timer
declare global {
  interface Window {
    __katabaticCursorTimer?: {
      timer: ReturnType<typeof setTimeout> | null;
      resetTimer: () => void;
      hideCursor: () => void;
      showCursor: () => void;
    };
  }
}
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface SlideLayoutProps {
  children: ReactNode
  variant?: "default" | "alt" | "dark" | "hero"
  className?: string
}

export function SlideLayout({ children, variant = "default", className }: SlideLayoutProps) {
      // Cursor auto-hide logic: global singleton
      useEffect(() => {
        const root = document.documentElement;
        if (!window.__katabaticCursorTimer) {
          let timer: ReturnType<typeof setTimeout> | null = null;
          const hideCursor = () => root.style.cursor = "none";
          const showCursor = () => root.style.cursor = "";
          const resetTimer = () => {
            showCursor();
            if (timer) clearTimeout(timer);
            timer = setTimeout(hideCursor, 3000);
          };
          window.addEventListener("mousemove", resetTimer);
          resetTimer();
          window.__katabaticCursorTimer = { timer, resetTimer, hideCursor, showCursor };
        }
        return () => {
          // Do not remove handler or clear timer on unmount
        };
      }, []);
    useEffect(() => {
      let wakeLock: WakeLockSentinel | null = null;
      const requestWakeLock = async () => {
        try {
          if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
          }
        } catch {}
      };
      requestWakeLock();
      // Re-acquire wake lock if released
      const handleVisibility = () => {
        if (wakeLock && document.visibilityState === 'visible') {
          requestWakeLock();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        if (wakeLock) wakeLock.release();
      };
    }, []);
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col justify-start items-stretch gap-4 box-border overflow-hidden font-sans",
        "px-16 pt-10 pb-8 text-[19px]",
        variant === "default" && "bg-bg text-text-primary",
        variant === "alt" && "bg-bg-alt text-text-primary",
        variant === "dark" && "bg-bg-dark text-white/92",
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
