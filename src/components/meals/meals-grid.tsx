"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ImageIcon, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { FavoriteButton } from "./favorite-button"

type MealCardData = {
  id: string
  name: string
  image_url: string | null
  favorited: boolean
}

export function MealsGrid({ meals }: { meals: MealCardData[] }) {
  const [filter, setFilter] = useState<"all" | "fav">("all")
  const shown = filter === "fav" ? meals.filter((m) => m.favorited) : meals
  const favCount = meals.filter((m) => m.favorited).length

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "h-9 rounded-full px-4 text-xs font-medium",
            filter === "all"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground"
          )}
        >
          All · {meals.length}
        </button>
        <button
          type="button"
          onClick={() => setFilter("fav")}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-medium",
            filter === "fav"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Star className={cn("size-3.5", filter === "fav" && "fill-current")} />
          Favorites · {favCount}
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="border-border bg-muted/30 text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          {filter === "fav" ? "No favorites yet." : "No meals."}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shown.map((m) => (
            <div
              key={m.id}
              className="group relative overflow-hidden rounded-xl border"
            >
              <Link href={`/meals/${m.id}`} className="block">
                <div className="bg-muted relative aspect-square">
                  {m.image_url ? (
                    <Image
                      src={m.image_url}
                      alt={m.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition-transform group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full items-center justify-center">
                      <ImageIcon className="size-8" />
                    </div>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <div className="truncate text-sm font-medium">{m.name}</div>
                </div>
              </Link>
              <div className="absolute right-2 top-2">
                <FavoriteButton mealId={m.id} favorited={m.favorited} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
