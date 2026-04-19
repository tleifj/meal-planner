"use client"

import { useState, useTransition } from "react"
import { ChevronDown, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import type { PlanMeal } from "@/lib/queries/plan"
import {
  addPlanMealAction,
  removePlanMealAction,
  flushPlanAction,
} from "@/lib/actions/plan"
import { MealPickerSheet } from "./meal-picker-sheet"
import { cn } from "@/lib/utils"

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]
const DAY_INDEX = [0, 1, 2, 3, 4, 5, 6]

export function WeekPlanner({
  planId,
  weekStart,
  planMeals,
  meals,
  lists,
}: {
  planId: string
  weekStart: string
  planMeals: PlanMeal[]
  meals: { id: string; name: string }[]
  lists: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState<Set<number>>(new Set([todayIndex()]))
  const [pickerDay, setPickerDay] = useState<number | null>(null)
  const [flushOpen, setFlushOpen] = useState(false)
  const [pending, start] = useTransition()

  const byDay = new Map<number, PlanMeal[]>()
  for (const p of planMeals) {
    const d = p.day_of_week ?? -1
    if (!byDay.has(d)) byDay.set(d, [])
    byDay.get(d)!.push(p)
  }
  const unflushedCount = planMeals.filter((m) => !m.added_to_list_at).length

  function toggle(d: number) {
    setOpen((curr) => {
      const copy = new Set(curr)
      if (copy.has(d)) copy.delete(d)
      else copy.add(d)
      return copy
    })
  }

  function onAdd(mealId: string) {
    if (pickerDay == null) return
    start(async () => {
      const res = await addPlanMealAction({
        plan_id: planId,
        meal_id: mealId,
        day_of_week: pickerDay,
      })
      if (res.error) toast.error(res.error)
      else setPickerDay(null)
    })
  }

  function remove(id: string) {
    start(async () => {
      try {
        await removePlanMealAction(id)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  function flush(listId: string) {
    start(async () => {
      const res = await flushPlanAction({ plan_id: planId, list_id: listId })
      if (res.error) toast.error(res.error)
      else {
        toast.success(
          res.count === 0 ? "Nothing to add" : `Added ${res.count} meal${res.count === 1 ? "" : "s"}`
        )
        setFlushOpen(false)
      }
    })
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="px-4 pb-32 pt-3">
        <div className="text-muted-foreground mb-3 text-xs">
          Week of {formatWeek(weekStart)}
        </div>
        <div className="space-y-2">
          {DAY_INDEX.map((d) => {
            const rows = byDay.get(d) ?? []
            const isOpen = open.has(d)
            return (
              <div key={d} className="overflow-hidden rounded-xl border">
                <button
                  type="button"
                  onClick={() => toggle(d)}
                  className="hover:bg-muted/50 flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{DAY_NAMES[d]}</div>
                    <div className="text-muted-foreground text-xs">
                      {rows.length === 0
                        ? "No meals"
                        : `${rows.length} meal${rows.length === 1 ? "" : "s"}`}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "text-muted-foreground size-4 transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen ? (
                  <div className="border-t">
                    {rows.length > 0 ? (
                      <ul className="divide-border divide-y">
                        {rows.map((pm) => (
                          <li
                            key={pm.id}
                            className="flex min-h-12 items-center gap-3 px-4 py-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">
                                {pm.meal.name}
                              </div>
                              {pm.added_to_list_at ? (
                                <div className="text-muted-foreground text-xs">
                                  Added to list
                                </div>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => remove(pm.id)}
                              className="text-muted-foreground hover:text-destructive flex size-9 items-center justify-center rounded-full"
                              aria-label="Remove"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setPickerDay(d)}
                      disabled={pending}
                      className="hover:bg-muted/50 flex min-h-11 w-full items-center gap-2 px-4 py-2.5 text-left text-sm"
                    >
                      <Plus className="size-4" />
                      Add meal
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-16 z-20 border-t px-4 py-3 backdrop-blur">
        <Button
          type="button"
          onClick={() => setFlushOpen(true)}
          disabled={pending || unflushedCount === 0 || lists.length === 0}
          className="h-12 w-full"
        >
          <ShoppingCart className="size-4" />
          {unflushedCount === 0
            ? "Nothing to add"
            : lists.length === 0
              ? "Create a list first"
              : `Add ${unflushedCount} meal${unflushedCount === 1 ? "" : "s"} to a list`}
        </Button>
      </div>

      <MealPickerSheet
        open={pickerDay !== null}
        onOpenChange={(v) => !v && setPickerDay(null)}
        meals={meals}
        onPick={onAdd}
        title={pickerDay !== null ? `Add to ${DAY_NAMES[pickerDay]}` : "Add meal"}
      />

      <Drawer open={flushOpen} onOpenChange={setFlushOpen}>
        <DrawerContent className="max-h-[70dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Pick a list</DrawerTitle>
            <DrawerDescription>
              Ingredients merge with matching items.
            </DrawerDescription>
          </DrawerHeader>
          <ul className="divide-border mx-4 mb-4 divide-y overflow-y-auto rounded-xl border">
            {lists.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => flush(l.id)}
                  disabled={pending}
                  className="hover:bg-muted/50 flex min-h-12 w-full items-center px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                >
                  {l.name}
                </button>
              </li>
            ))}
          </ul>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

function todayIndex() {
  const d = new Date().getDay()
  // JS Date: 0=Sun, 1=Mon... Our index: 0=Mon, 6=Sun
  return d === 0 ? 6 : d - 1
}

function formatWeek(weekStart: string) {
  const d = new Date(weekStart)
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}
