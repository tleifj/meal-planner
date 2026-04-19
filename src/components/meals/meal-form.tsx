"use client"

import { useRef, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Camera, Minus, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  IngredientPickerSheet,
  type PickedIngredient,
} from "./ingredient-picker-sheet"
import {
  createMealAction,
  updateMealAction,
  updateMealImageAction,
  upsertMealIngredientAction,
  removeMealIngredientAction,
} from "@/lib/actions/meals"
import { createClient } from "@/lib/supabase/client"
import { resizeImage } from "@/lib/utils/image"

type Category = { id: number; slug: string; name: string; sort_order: number; icon: string | null }
type LibraryItem = {
  id: string
  name: string
  category_id: number
  default_unit: string | null
  is_global: boolean
}

type Initial = {
  id: string
  name: string
  description: string | null
  image_path: string | null
  image_url: string | null
  family_id: string
  ingredients: {
    id: string
    library_item_id: string
    quantity: number
    unit: string | null
    default_unit: string | null
    name: string
    category_id: number
  }[]
} | null

type FormIngredient = PickedIngredient & { dbId?: string }

export function MealForm({
  familyId,
  categories,
  library,
  initial,
}: {
  familyId: string
  categories: Category[]
  library: LibraryItem[]
  initial?: Initial
}) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [ingredients, setIngredients] = useState<FormIngredient[]>(
    initial?.ingredients.map((i) => ({
      dbId: i.id,
      library_item_id: i.library_item_id,
      name: i.name,
      quantity: Number(i.quantity),
      unit: i.unit,
      default_unit: i.default_unit,
      category_id: i.category_id,
    })) ?? []
  )
  const [libraryState, setLibrary] = useState(library)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.image_url ?? null)
  const [pending, start] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function onPickImage(file: File) {
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  function clearImage() {
    setImageFile(null)
    setPreviewUrl(null)
  }

  function onPickIngredient(ing: PickedIngredient) {
    setIngredients((curr) => {
      const existing = curr.findIndex((i) => i.library_item_id === ing.library_item_id)
      if (existing >= 0) {
        const copy = curr.slice()
        copy[existing] = { ...copy[existing], quantity: copy[existing].quantity + 1 }
        return copy
      }
      return [...curr, ing]
    })
    setPickerOpen(false)
  }

  function adjustQuantity(idx: number, delta: number) {
    setIngredients((curr) => {
      const copy = curr.slice()
      const next = Math.max(0.25, Math.round((copy[idx].quantity + delta) * 4) / 4)
      copy[idx] = { ...copy[idx], quantity: next }
      return copy
    })
  }

  function removeAt(idx: number) {
    setIngredients((curr) => curr.filter((_, i) => i !== idx))
  }

  async function uploadImage(mealId: string): Promise<string | null> {
    if (!imageFile) return null
    const supabase = createClient()
    const blob = await resizeImage(imageFile)
    const path = `${familyId}/${mealId}.jpg`
    const { error } = await supabase.storage
      .from("meal-images")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" })
    if (error) throw error
    return path
  }

  function onSubmit() {
    if (!name.trim()) {
      toast.error("Name required")
      return
    }
    start(async () => {
      try {
        let mealId = initial?.id ?? ""

        if (initial) {
          const res = await updateMealAction({
            id: initial.id,
            name: name.trim(),
            description: description.trim() || null,
          })
          if (res.error) throw new Error(res.error)

          const initialIngIds = new Set(initial.ingredients.map((i) => i.id))
          const keptIds = new Set(
            ingredients.filter((i) => i.dbId).map((i) => i.dbId!)
          )
          for (const old of initial.ingredients) {
            if (!keptIds.has(old.id)) {
              await removeMealIngredientAction(old.id, initial.id)
            }
          }
          for (const ing of ingredients) {
            if (ing.dbId && initialIngIds.has(ing.dbId)) {
              const prev = initial.ingredients.find((i) => i.id === ing.dbId)
              if (
                prev &&
                (Number(prev.quantity) !== ing.quantity || prev.unit !== ing.unit)
              ) {
                await upsertMealIngredientAction({
                  meal_id: initial.id,
                  library_item_id: ing.library_item_id,
                  quantity: ing.quantity,
                  unit: ing.unit,
                })
              }
            } else {
              await upsertMealIngredientAction({
                meal_id: initial.id,
                library_item_id: ing.library_item_id,
                quantity: ing.quantity,
                unit: ing.unit,
              })
            }
          }
        } else {
          const res = await createMealAction({
            name: name.trim(),
            description: description.trim() || null,
            ingredients: ingredients.map((i) => ({
              library_item_id: i.library_item_id,
              quantity: i.quantity,
              unit: i.unit,
            })),
          })
          if (res.error || !res.id) throw new Error(res.error ?? "Failed")
          mealId = res.id
        }

        if (imageFile) {
          const path = await uploadImage(mealId)
          if (path) {
            const r = await updateMealImageAction(mealId, path)
            if (r.error) throw new Error(r.error)
          }
        } else if (initial && initial.image_path && !previewUrl) {
          await updateMealImageAction(mealId, null)
          const supabase = createClient()
          await supabase.storage.from("meal-images").remove([initial.image_path])
        }

        toast.success(initial ? "Saved" : "Created")
        router.push(`/meals/${mealId}`)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  return (
    <div className="space-y-5 px-4 pb-28 pt-3">
      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-muted relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl"
        >
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Meal"
              fill
              sizes="(max-width: 640px) 100vw, 640px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="text-muted-foreground flex flex-col items-center gap-2">
              <Camera className="size-8" />
              <span className="text-xs">Add photo</span>
            </div>
          )}
        </button>
        {previewUrl ? (
          <button
            type="button"
            onClick={clearImage}
            className="text-muted-foreground mt-2 flex items-center gap-1 text-xs"
          >
            <X className="size-3" /> Remove photo
          </button>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onPickImage(f)
            e.target.value = ""
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="meal-name">Name</Label>
        <Input
          id="meal-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sheet-pan chicken"
          className="h-11"
          maxLength={120}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="meal-desc">Description (optional)</Label>
        <textarea
          id="meal-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notes, recipe source, etc."
          rows={3}
          className="border-input bg-background focus-visible:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
          maxLength={1000}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Ingredients</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPickerOpen(true)}
            className="h-9"
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
        {ingredients.length === 0 ? (
          <div className="border-border bg-muted/30 text-muted-foreground rounded-xl border border-dashed p-6 text-center text-xs">
            No ingredients yet.
          </div>
        ) : (
          <ul className="divide-border divide-y overflow-hidden rounded-xl border">
            {ingredients.map((ing, idx) => (
              <li
                key={`${ing.library_item_id}-${idx}`}
                className="flex min-h-12 items-center gap-2 px-3 py-2"
              >
                <div className="min-w-0 flex-1 truncate text-sm font-medium">
                  {ing.name}
                </div>
                <div className="bg-muted flex h-9 items-center rounded-full px-1 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => adjustQuantity(idx, -0.5)}
                    className="hover:bg-background/80 flex size-7 items-center justify-center rounded-full"
                    aria-label="Decrease"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="min-w-10 text-center tabular-nums">
                    {ing.quantity % 1 === 0
                      ? ing.quantity
                      : ing.quantity.toFixed(2).replace(/\.?0+$/, "")}
                    {ing.unit || ing.default_unit
                      ? ` ${ing.unit ?? ing.default_unit}`
                      : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustQuantity(idx, 0.5)}
                    className="hover:bg-background/80 flex size-7 items-center justify-center rounded-full"
                    aria-label="Increase"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="text-muted-foreground hover:text-destructive flex size-9 items-center justify-center rounded-full"
                  aria-label="Remove"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-16 z-20 border-t px-4 py-3 backdrop-blur">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={pending || !name.trim()}
          className="h-12 w-full"
        >
          {pending ? "Saving…" : initial ? "Save changes" : "Create meal"}
        </Button>
      </div>

      <IngredientPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        categories={categories}
        library={libraryState}
        onPick={onPickIngredient}
        onLibraryAdded={(item) => setLibrary((curr) => [...curr, item])}
      />
    </div>
  )
}
