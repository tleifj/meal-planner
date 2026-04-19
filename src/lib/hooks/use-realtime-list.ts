"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { GroceryListItem } from "@/lib/queries/lists"

type Category = {
  id: number
  slug: string
  name: string
  sort_order: number
  icon: string | null
}

type LibraryItem = Pick<
  GroceryListItem["library_item"],
  "id" | "name" | "category_id" | "default_unit" | "is_global"
>

export function useRealtimeList(
  listId: string,
  initial: GroceryListItem[],
  categories: Category[]
) {
  // Server data syncs in — this is the documented React 19 pattern
  // for resetting state based on prop identity change.
  const [syncedInitial, setSyncedInitial] = useState(initial)
  const [items, setItems] = useState<GroceryListItem[]>(initial)
  if (syncedInitial !== initial) {
    setSyncedInitial(initial)
    setItems(initial)
  }

  const categoriesRef = useRef(categories)
  useEffect(() => {
    categoriesRef.current = categories
  }, [categories])

  useEffect(() => {
    const supabase = createClient()
    const libraryCache = new Map<string, LibraryItem>()

    async function fetchLibrary(id: string): Promise<LibraryItem | null> {
      if (libraryCache.has(id)) return libraryCache.get(id)!
      const { data } = await supabase
        .from("grocery_library_items")
        .select("id, name, category_id, default_unit, is_global")
        .eq("id", id)
        .maybeSingle()
      if (data) libraryCache.set(id, data as LibraryItem)
      return (data as LibraryItem) ?? null
    }

    const channel = supabase
      .channel(`list:${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "grocery_list_items",
          filter: `list_id=eq.${listId}`,
        },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string })?.id
            if (!oldId) return
            setItems((curr) => curr.filter((i) => i.id !== oldId))
            return
          }

          const row = payload.new as Omit<GroceryListItem, "library_item" | "category">
          const lib = await fetchLibrary(row.library_item_id)
          const cat = categoriesRef.current.find((c) => c.id === lib?.category_id)
          if (!lib || !cat) return

          const enriched: GroceryListItem = {
            ...row,
            library_item: lib,
            category: cat,
          }

          setItems((curr) => {
            const idx = curr.findIndex((i) => i.id === row.id)
            if (idx === -1) return [...curr, enriched]
            const copy = curr.slice()
            copy[idx] = enriched
            return copy
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listId])

  return items
}
