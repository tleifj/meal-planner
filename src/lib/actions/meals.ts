"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

async function currentFamilyId() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/login")
  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (!profile?.family_id) redirect("/onboarding")
  return { supabase, userId: auth.user.id, familyId: profile.family_id as string }
}

const ingredientSchema = z.object({
  library_item_id: z.string().uuid(),
  quantity: z.coerce.number().positive().default(1),
  unit: z.string().max(16).nullable().optional(),
  note: z.string().max(200).nullable().optional(),
})

const createMealSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional().nullable(),
  ingredients: z.array(ingredientSchema).default([]),
})

export async function createMealAction(input: {
  name: string
  description?: string | null
  ingredients: {
    library_item_id: string
    quantity: number
    unit?: string | null
    note?: string | null
  }[]
}) {
  const parsed = createMealSchema.safeParse(input)
  if (!parsed.success) return { error: "Invalid meal data", id: null }

  const { supabase, familyId, userId } = await currentFamilyId()

  const { data: meal, error } = await supabase
    .from("meals")
    .insert({
      family_id: familyId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      created_by: userId,
    })
    .select("id")
    .single()
  if (error || !meal) return { error: error?.message ?? "Failed", id: null }

  if (parsed.data.ingredients.length > 0) {
    const rows = parsed.data.ingredients.map((i) => ({
      meal_id: meal.id,
      library_item_id: i.library_item_id,
      quantity: i.quantity,
      unit: i.unit ?? null,
      note: i.note ?? null,
    }))
    const { error: ingErr } = await supabase.from("meal_ingredients").insert(rows)
    if (ingErr) return { error: ingErr.message, id: meal.id }
  }

  revalidatePath("/meals")
  return { id: meal.id as string, error: null }
}

const updateMealSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(1000).nullable().optional(),
})

export async function updateMealAction(input: {
  id: string
  name: string
  description?: string | null
}) {
  const parsed = updateMealSchema.safeParse(input)
  if (!parsed.success) return { error: "Invalid input" }

  const { supabase } = await currentFamilyId()
  const { error } = await supabase
    .from("meals")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
  if (error) return { error: error.message }

  revalidatePath(`/meals/${parsed.data.id}`)
  revalidatePath("/meals")
  return { error: null }
}

export async function updateMealImageAction(mealId: string, imagePath: string | null) {
  const { supabase } = await currentFamilyId()
  const { error } = await supabase
    .from("meals")
    .update({ image_path: imagePath, updated_at: new Date().toISOString() })
    .eq("id", mealId)
  if (error) return { error: error.message }
  revalidatePath(`/meals/${mealId}`)
  revalidatePath("/meals")
  return { error: null }
}

export async function deleteMealAction(mealId: string) {
  const { supabase } = await currentFamilyId()

  const { data: meal } = await supabase
    .from("meals")
    .select("image_path")
    .eq("id", mealId)
    .maybeSingle()

  const { error } = await supabase.from("meals").delete().eq("id", mealId)
  if (error) throw new Error(error.message)

  if (meal?.image_path) {
    await supabase.storage.from("meal-images").remove([meal.image_path])
  }

  revalidatePath("/meals")
  redirect("/meals")
}

const addIngSchema = z.object({
  meal_id: z.string().uuid(),
  library_item_id: z.string().uuid(),
  quantity: z.coerce.number().positive().default(1),
  unit: z.string().max(16).nullable().optional(),
  note: z.string().max(200).nullable().optional(),
})

export async function upsertMealIngredientAction(input: {
  meal_id: string
  library_item_id: string
  quantity: number
  unit?: string | null
  note?: string | null
}) {
  const parsed = addIngSchema.safeParse(input)
  if (!parsed.success) return { error: "Invalid" }

  const { supabase } = await currentFamilyId()
  const { error } = await supabase.from("meal_ingredients").upsert(
    {
      meal_id: parsed.data.meal_id,
      library_item_id: parsed.data.library_item_id,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit ?? null,
      note: parsed.data.note ?? null,
    },
    { onConflict: "meal_id,library_item_id" }
  )
  if (error) return { error: error.message }
  revalidatePath(`/meals/${parsed.data.meal_id}`)
  return { error: null }
}

export async function removeMealIngredientAction(id: string, mealId: string) {
  const { supabase } = await currentFamilyId()
  const { error } = await supabase.from("meal_ingredients").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath(`/meals/${mealId}`)
}

export async function addMealToListAction(input: {
  list_id: string
  meal_id: string
  multiplier?: number
}) {
  const { supabase } = await currentFamilyId()
  const { error } = await supabase.rpc("add_meal_to_list", {
    p_list_id: input.list_id,
    p_meal_id: input.meal_id,
    p_mult: input.multiplier ?? 1,
  })
  if (error) return { error: error.message }
  revalidatePath(`/lists/${input.list_id}`)
  return { error: null }
}
