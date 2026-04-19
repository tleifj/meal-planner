"use client"

import { useRef, useState, type PointerEvent } from "react"
import { Trash2, Minus, Plus } from "lucide-react"
import type { GroceryListItem } from "@/lib/queries/lists"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

const SWIPE_THRESHOLD = 120

export function ListItemRow({
  item,
  onToggle,
  onDelete,
  onQuantity,
}: {
  item: GroceryListItem
  onToggle: (checked: boolean) => void
  onDelete: () => void
  onQuantity: (q: number) => void
}) {
  const [offset, setOffset] = useState(0)
  const [locked, setLocked] = useState(false)
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const axis = useRef<"x" | "y" | null>(null)

  function onPointerDown(e: PointerEvent) {
    if (locked) return
    startX.current = e.clientX
    startY.current = e.clientY
    axis.current = null
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: PointerEvent) {
    if (startX.current == null || startY.current == null) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    if (!axis.current) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      axis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y"
    }
    if (axis.current === "x") {
      e.preventDefault()
      setOffset(Math.min(0, dx))
    }
  }
  function onPointerUp() {
    if (axis.current === "x" && Math.abs(offset) > SWIPE_THRESHOLD) {
      setLocked(true)
      setOffset(-9999)
      onDelete()
    } else {
      setOffset(0)
    }
    startX.current = null
    startY.current = null
    axis.current = null
  }

  return (
    <li className="relative overflow-hidden">
      <div className="bg-destructive absolute inset-y-0 right-0 flex items-center justify-end pr-4 text-white">
        <Trash2 className="size-5" />
      </div>
      <div
        className="bg-background relative flex min-h-14 items-center gap-3 px-4 py-2.5 transition-transform"
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Checkbox
          checked={item.checked}
          onCheckedChange={(checked) => onToggle(Boolean(checked))}
          className="size-5"
        />
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate text-sm font-medium",
              item.checked && "text-muted-foreground line-through"
            )}
          >
            {item.library_item.name}
          </div>
          {item.note ? (
            <div className="text-muted-foreground truncate text-xs">{item.note}</div>
          ) : null}
        </div>
        <QuantityStepper
          value={Number(item.quantity)}
          unit={item.unit ?? item.library_item.default_unit ?? ""}
          onChange={onQuantity}
        />
      </div>
    </li>
  )
}

function QuantityStepper({
  value,
  unit,
  onChange,
}: {
  value: number
  unit: string
  onChange: (q: number) => void
}) {
  const [local, setLocal] = useState(value)
  const step = Number.isInteger(value) && value >= 1 ? 1 : 0.5
  function commit(next: number) {
    const n = Math.max(0.25, Math.round(next * 4) / 4)
    setLocal(n)
    onChange(n)
  }
  return (
    <div className="bg-muted flex h-9 items-center rounded-full px-1 text-xs font-medium">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          commit(local - step)
        }}
        className="hover:bg-background/80 flex size-7 items-center justify-center rounded-full"
        aria-label="Decrease"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-10 text-center tabular-nums">
        {local % 1 === 0 ? local : local.toFixed(2).replace(/\.?0+$/, "")}
        {unit ? ` ${unit}` : ""}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          commit(local + step)
        }}
        className="hover:bg-background/80 flex size-7 items-center justify-center rounded-full"
        aria-label="Increase"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}
