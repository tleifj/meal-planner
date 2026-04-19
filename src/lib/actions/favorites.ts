"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function toggleFavoriteAction(mealId: string) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/login")

  const { data: existing } = await supabase
    .from("meal_favorites")
    .select("meal_id")
    .eq("meal_id", mealId)
    .eq("user_id", auth.user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("meal_favorites")
      .delete()
      .eq("meal_id", mealId)
      .eq("user_id", auth.user.id)
    if (error) return { error: error.message, favorited: true }
    revalidatePath("/meals")
    revalidatePath(`/meals/${mealId}`)
    return { error: null, favorited: false }
  }

  const { error } = await supabase
    .from("meal_favorites")
    .insert({ meal_id: mealId, user_id: auth.user.id })
  if (error) return { error: error.message, favorited: false }
  revalidatePath("/meals")
  revalidatePath(`/meals/${mealId}`)
  return { error: null, favorited: true }
}
