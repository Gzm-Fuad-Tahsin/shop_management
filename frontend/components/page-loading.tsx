"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

type PageLoadingProps = {
  compact?: boolean
  className?: string
}

export function BrandLoadingMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={cn("relative", compact ? "h-16 w-16" : "h-20 w-20")}>
        <Image
          src="/logo%20(2).png"
          alt="Loading"
          fill
          sizes={compact ? "64px" : "80px"}
          className="object-contain grayscale contrast-0 brightness-0 opacity-60"
          priority
        />
      </div>
      <div className={cn("overflow-hidden rounded-full bg-zinc-300/70", compact ? "h-px w-40" : "h-px w-56")}>
        <div className="h-full w-1/3 animate-pulse rounded-full bg-zinc-900/70" />
      </div>
    </div>
  )
}

export function PageLoading({ compact = false, className }: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(229,231,235,0.72)_42%,rgba(244,244,245,0.96))] px-4",
        compact ? "min-h-[320px]" : "min-h-[100svh]",
        className,
      )}
    >
      <div
        className={cn(
          "rounded-3xl border border-white/60 bg-white/70 px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur-xl",
          compact ? "w-full max-w-xs py-8" : "w-full max-w-sm",
        )}
      >
        <BrandLoadingMark compact={compact} />
      </div>
    </div>
  )
}
