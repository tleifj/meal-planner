"use client"

import { useMemo, useState, useTransition } from "react"
import { Plus, Search } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { addLibraryItemAction } from "@/lib/actions/lists"

type Category = { id: number; slug: string; name: string; sort_order: number; icon: string | null }
type LibraryItem = {
  id: string
  name: string
  category_id: number
  default_unit: string | null
  is_global: boolean
}

export type PickedIngredient = {
  library_item_id: string
  name: string
  quantity: number
  unit: string | null
  default_unit: string | null
  category_id: number
}

export function IngredientPickerSheet({
  open,
  onOpenChange,
  categories,
  library,
  onPick,
  onLibraryAdded,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  categories: Category[]
  library: LibraryItem[]
  onPick: (ing: PickedIngredient) => void
  onLibraryAdded?: (item: LibraryItem) => void
}) {
  const [query, setQuery] = useState("")
  const [pending, start] = useTransition()
  const [createMode, setCreateMode] = useState(false)
  const [createCatId, setCreateCatId] = useState<number>(categories[0]?.id ?? 1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return library.slice(0, 60)
    return library.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 60)
  }, [library, query])

  const exact = library.find((i) => i.name.toLowerCase() === query.trim().toLowerCase())

  function pickExisting(item: LibraryItem) {
    onPick({
      library_item_id: item.id,
      name: item.name,
      quantity: 1,
      unit: item.default_unit,
      default_unit: item.default_unit,
      category_id: item.category_id,
    })
    setQuery("")
  }

  function createAndPick() {
    start(async () => {
      const fd = new FormData()
      fd.set("name", query.trim())
      fd.set("categoryId", String(createCatId))
      const res = await addLibraryItemAction(fd)
      if (res.error || !res.id) {
        toast.error(res.error ?? "Failed")
        return
      }
      const newItem: LibraryItem = {
        id: res.id,
        name: query.trim(),
        category_id: createCatId,
        default_unit: null,
        is_global: false,
      }
      onLibraryAdded?.(newItem)
      pickExisting(newItem)
      setCreateMode(false)
    })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Add ingredient</DrawerTitle>
          <DrawerDescription>
            Search the library or create a new item.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-hidden px-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              autoFocus
              placeholder="Search items…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 pl-9"
            />
          </div>

          {createMode ? (
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCreateCatId(c.id)}
                      className={
                        createCatId === c.id
                          ? "bg-foreground text-background rounded-full px-3 py-1.5 text-xs font-medium"
                          : "bg-muted text-foreground hover:bg-muted/80 rounded-full px-3 py-1.5 text-xs font-medium"
                      }
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1"
                  onClick={() => setCreateMode(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="h-11 flex-1"
                  disabled={pending || !query.trim()}
                  onClick={createAndPick}
                >
                  {pending ? "Adding…" : "Add"}
                </Button>
              </div>
            </div>
          ) : (
            <ul className="mt-3 max-h-[calc(85dvh-14rem)] divide-y overflow-y-auto rounded-xl border">
              {filtered.map((item) => {
                const cat = categories.find((c) => c.id === item.category_id)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => pickExisting(item)}
                      className="hover:bg-muted/50 flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left"
                    >
                      <div className="flex-1 truncate">
                        <div className="truncate text-sm font-medium">{item.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {cat?.name ?? ""} {!item.is_global ? "· family" : ""}
                        </div>
                      </div>
                      <Plus className="text-muted-foreground size-4" />
                    </button>
                  </li>
                )
              })}
              {query.trim() && !exact ? (
                <li>
                  <button
                    type="button"
                    onClick={() => setCreateMode(true)}
                    className="hover:bg-muted/50 flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <Plus className="size-4" />
                    <span className="text-sm">
                      Create{" "}
                      <span className="font-semibold">&ldquo;{query.trim()}&rdquo;</span>
                    </span>
                  </button>
                </li>
              ) : null}
            </ul>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
