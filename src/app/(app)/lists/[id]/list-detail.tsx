"use client"

import { useMemo, useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { useRealtimeList } from "@/lib/hooks/use-realtime-list"
import type { GroceryListItem } from "@/lib/queries/lists"
import {
  toggleCheckedAction,
  deleteListItemAction,
  updateQuantityAction,
} from "@/lib/actions/lists"
import { ListItemRow } from "@/components/lists/list-item-row"
import { AddItemSheet } from "@/components/lists/add-item-sheet"
import { Button } from "@/components/ui/button"

type Category = { id: number; slug: string; name: string; sort_order: number; icon: string | null }
type LibraryItem = {
  id: string
  name: string
  category_id: number
  default_unit: string | null
  is_global: boolean
}

export function ListDetail({
  listId,
  initialItems,
  categories,
  library,
}: {
  listId: string
  initialItems: GroceryListItem[]
  categories: Category[]
  library: LibraryItem[]
}) {
  const items = useRealtimeList(listId, initialItems, categories)
  const [, start] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)

  const grouped = useMemo(() => {
    const map = new Map<number, { category: Category; rows: GroceryListItem[] }>()
    for (const row of items) {
      const category = categories.find((c) => c.id === row.category.id) ?? row.category
      if (!map.has(category.id)) map.set(category.id, { category, rows: [] })
      map.get(category.id)!.rows.push(row)
    }
    return [...map.values()].sort((a, b) => a.category.sort_order - b.category.sort_order)
  }, [items, categories])

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="flex-1 px-4 pb-28 pt-3">
        {items.length === 0 ? (
          <div className="border-border bg-muted/30 text-muted-foreground flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-sm">
            <p>This list is empty.</p>
            <p className="text-xs">Tap the button below to add items.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(({ category, rows }) => (
              <section key={category.id}>
                <h2 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
                  {category.name}
                </h2>
                <ul className="divide-border divide-y overflow-hidden rounded-xl border">
                  {rows.map((row) => (
                    <ListItemRow
                      key={row.id}
                      item={row}
                      onToggle={(next) => start(() => toggleCheckedAction(row.id, next))}
                      onDelete={() => start(() => deleteListItemAction(row.id))}
                      onQuantity={(q) => start(() => updateQuantityAction(row.id, q))}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <Button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 h-14 w-14 rounded-full shadow-lg"
        aria-label="Add item"
      >
        <Plus className="size-6" />
      </Button>

      <AddItemSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        listId={listId}
        categories={categories}
        library={library}
      />
    </div>
  )
}
