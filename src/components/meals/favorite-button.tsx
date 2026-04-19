"use client"

import { useOptimistic, useTransition } from "react"
import { Star } from "lucide-react"
import { toggleFavoriteAction } from "@/lib/actions/favorites"
import { cn } from "@/lib/utils"

export function FavoriteButton({
  mealId,
  favorited,
  variant = "icon",
}: {
  mealId: string
  favorited: boolean
  variant?: "icon" | "pill"
}) {
  const [optimistic, setOptimistic] = useOptimistic(favorited)
  const [, start] = useTransition()

  function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    start(async () => {
      setOptimistic(!optimistic)
      await toggleFavoriteAction(mealId)
    })
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium",
          optimistic
            ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Star className={cn("size-3.5", optimistic && "fill-current")} />
        {optimistic ? "Favorited" : "Favorite"}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={optimistic ? "Unfavorite" : "Favorite"}
      className="flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
    >
      <Star className={cn("size-4", optimistic && "fill-amber-400 text-amber-400")} />
    </button>
  )
}
