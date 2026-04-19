"use client"

import { useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"

type Meal = { id: string; name: string }

export function MealPickerSheet({
  open,
  onOpenChange,
  meals,
  onPick,
  title = "Add meal",
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  meals: Meal[]
  onPick: (mealId: string) => void
  title?: string
}) {
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return meals
    return meals.filter((m) => m.name.toLowerCase().includes(q))
  }, [meals, query])

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[75dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>Pick a meal from your library.</DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden px-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              autoFocus
              placeholder="Search meals…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 pl-9"
            />
          </div>
          {meals.length === 0 ? (
            <p className="text-muted-foreground mt-6 text-center text-xs">
              No meals yet. Create one from the Meals tab.
            </p>
          ) : (
            <ul className="mt-3 max-h-[calc(75dvh-14rem)] divide-y overflow-y-auto rounded-xl border">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(m.id)
                      setQuery("")
                    }}
                    className="hover:bg-muted/50 flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left"
                  >
                    <div className="flex-1 truncate text-sm font-medium">{m.name}</div>
                    <Plus className="text-muted-foreground size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
