"use client"

import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { usePullToRefresh } from "@/lib/hooks/use-pull-to-refresh"

export function PullToRefresh() {
  const router = useRouter()
  const { pull, refreshing, trigger } = usePullToRefresh(async () => {
    router.refresh()
    await new Promise((r) => setTimeout(r, 350))
  })

  const progress = Math.min(1, pull / trigger)
  const opacity = Math.min(1, pull / 20)

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center"
      style={{
        transform: `translateY(${pull}px)`,
        opacity,
      }}
    >
      <div className="bg-background mt-2 flex size-9 items-center justify-center rounded-full border shadow-sm">
        <RefreshCw
          className={refreshing ? "size-4 animate-spin" : "size-4"}
          style={{
            transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
          }}
        />
      </div>
    </div>
  )
}
