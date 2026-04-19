"use client"

import { useMemo, useState, useTransition } from "react"
import { Plus, Search, Trash2, Pencil, Check, X } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import {
  createLibraryItemAction,
  updateLibraryItemAction,
  deleteLibraryItemAction,
} from "@/lib/actions/admin"

type Category = { id: number; name: string }
type Item = {
  id: string
  name: string
  category_id: number
  default_unit: string | null
}

export function LibraryTable({
  items,
  categories,
}: {
  items: Item[]
  categories: Category[]
}) {
  const [query, setQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [pending, start] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) => i.name.toLowerCase().includes(q))
  }, [items, query])

  function remove(id: string) {
    if (!confirm("Delete this library item?")) return
    start(async () => {
      try {
        await deleteLibraryItemAction(id)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search library…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 pl-9"
          />
        </div>
        <Button
          type="button"
          onClick={() => setAddOpen(true)}
          className="h-11"
        >
          <Plus className="size-4" />
          New
        </Button>
      </div>

      <ul className="divide-border mt-3 divide-y overflow-hidden rounded-xl border">
        {filtered.map((it) =>
          editingId === it.id ? (
            <EditRow
              key={it.id}
              item={it}
              categories={categories}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <li
              key={it.id}
              className="flex min-h-12 items-center gap-3 px-4 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{it.name}</div>
                <div className="text-muted-foreground text-xs">
                  {categories.find((c) => c.id === it.category_id)?.name ?? "?"}
                  {it.default_unit ? ` · ${it.default_unit}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingId(it.id)}
                className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-full"
                aria-label="Edit"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(it.id)}
                disabled={pending}
                className="text-muted-foreground hover:text-destructive flex size-9 items-center justify-center rounded-full"
                aria-label="Delete"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          )
        )}
        {filtered.length === 0 ? (
          <li className="text-muted-foreground px-4 py-8 text-center text-sm">
            No items match.
          </li>
        ) : null}
      </ul>

      <AddDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        categories={categories}
      />
    </>
  )
}

function EditRow({
  item,
  categories,
  onDone,
}: {
  item: Item
  categories: Category[]
  onDone: () => void
}) {
  const [name, setName] = useState(item.name)
  const [catId, setCatId] = useState(item.category_id)
  const [unit, setUnit] = useState(item.default_unit ?? "")
  const [pending, start] = useTransition()

  function save() {
    start(async () => {
      const res = await updateLibraryItemAction({
        id: item.id,
        name: name.trim(),
        category_id: catId,
        default_unit: unit.trim() || null,
      })
      if (res.error) toast.error(res.error)
      else onDone()
    })
  }

  return (
    <li className="space-y-2 px-4 py-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-10"
      />
      <div className="flex items-center gap-2">
        <select
          value={catId}
          onChange={(e) => setCatId(Number(e.target.value))}
          className="border-input bg-background h-10 flex-1 rounded-md border px-3 text-sm"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Unit"
          className="h-10 w-24"
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          className="h-10 flex-1"
        >
          <X className="size-4" />
          Cancel
        </Button>
        <Button
          type="button"
          disabled={pending || !name.trim()}
          onClick={save}
          className="h-10 flex-1"
        >
          <Check className="size-4" />
          Save
        </Button>
      </div>
    </li>
  )
}

function AddDrawer({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  categories: Category[]
}) {
  const [name, setName] = useState("")
  const [catId, setCatId] = useState(categories[0]?.id ?? 1)
  const [unit, setUnit] = useState("")
  const [pending, start] = useTransition()

  function submit() {
    start(async () => {
      const fd = new FormData()
      fd.set("name", name.trim())
      fd.set("category_id", String(catId))
      fd.set("default_unit", unit.trim())
      const res = await createLibraryItemAction(fd)
      if (res.error) toast.error(res.error)
      else {
        toast.success("Added")
        setName("")
        setUnit("")
        onOpenChange(false)
      }
    })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[70dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>New library item</DrawerTitle>
          <DrawerDescription>
            Global items are visible to all families.
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-3 px-4 pb-6">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
              placeholder="e.g. Oyster sauce"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              value={catId}
              onChange={(e) => setCatId(Number(e.target.value))}
              className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Default unit (optional)</Label>
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="h-11"
              placeholder="ea / lb / oz / gal"
            />
          </div>
          <Button
            type="button"
            onClick={submit}
            disabled={pending || !name.trim()}
            className="h-11 w-full"
          >
            {pending ? "Adding…" : "Add item"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
