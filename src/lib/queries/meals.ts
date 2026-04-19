import type { SupabaseClient } from "@supabase/supabase-js"

export type Meal = {
  id: string
  family_id: string
  name: string
  description: string | null
  image_path: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type MealIngredient = {
  id: string
  meal_id: string
  library_item_id: string
  quantity: number
  unit: string | null
  note: string | null
  library_item: {
    id: string
    name: string
    category_id: number
    default_unit: string | null
    is_global: boolean
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchMeals(supabase: SupabaseClient<any>, familyId: string) {
  const { data, error } = await supabase
    .from("meals")
    .select("id, family_id, name, description, image_path, created_by, created_at, updated_at")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as Meal[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchMealById(supabase: SupabaseClient<any>, id: string) {
  const { data, error } = await supabase
    .from("meals")
    .select("id, family_id, name, description, image_path, created_by, created_at, updated_at")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data as Meal | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchMealIngredients(supabase: SupabaseClient<any>, mealId: string) {
  const { data, error } = await supabase
    .from("meal_ingredients")
    .select(
      `id, meal_id, library_item_id, quantity, unit, note,
       library_item:grocery_library_items!inner (
         id, name, category_id, default_unit, is_global
       )`
    )
    .eq("meal_id", mealId)
  if (error) throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as any as MealIngredient[]
}

export async function getSignedMealImageUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  path: string | null,
  expiresIn = 3600
): Promise<string | null> {
  if (!path) return null
  const { data } = await supabase.storage.from("meal-images").createSignedUrl(path, expiresIn)
  return data?.signedUrl ?? null
}

export async function fetchFavoriteMealIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from("meal_favorites")
    .select("meal_id")
    .eq("user_id", userId)
  return new Set(((data ?? []) as { meal_id: string }[]).map((r) => r.meal_id))
}

export async function fetchActiveLists(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  familyId: string
) {
  const { data, error } = await supabase
    .from("grocery_lists")
    .select("id, name")
    .eq("family_id", familyId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as { id: string; name: string }[]
}
