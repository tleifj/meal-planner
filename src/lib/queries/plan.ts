import type { SupabaseClient } from "@supabase/supabase-js"
import { startOfWeek, format } from "date-fns"

export type PlanMeal = {
  id: string
  plan_id: string
  meal_id: string
  day_of_week: number | null
  meal_slot: string | null
  servings_multiplier: number
  added_to_list_at: string | null
  meal: {
    id: string
    name: string
    image_path: string | null
  }
}

export function currentWeekStart(d: Date = new Date()) {
  return startOfWeek(d, { weekStartsOn: 1 })
}

export function weekStartISO(d: Date = new Date()) {
  return format(currentWeekStart(d), "yyyy-MM-dd")
}

export async function fetchOrCreateWeekPlan(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  familyId: string,
  userId: string,
  weekStart: string
) {
  const { data: existing } = await supabase
    .from("meal_plans")
    .select("id, family_id, week_start, created_by")
    .eq("family_id", familyId)
    .eq("week_start", weekStart)
    .maybeSingle()

  if (existing) return existing

  const { data, error } = await supabase
    .from("meal_plans")
    .insert({ family_id: familyId, week_start: weekStart, created_by: userId })
    .select("id, family_id, week_start, created_by")
    .single()
  if (error) throw error
  return data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchPlanMeals(supabase: SupabaseClient<any>, planId: string) {
  const { data, error } = await supabase
    .from("meal_plan_meals")
    .select(
      `id, plan_id, meal_id, day_of_week, meal_slot, servings_multiplier, added_to_list_at,
       meal:meals!inner ( id, name, image_path )`
    )
    .eq("plan_id", planId)
    .order("day_of_week", { ascending: true })
  if (error) throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as any as PlanMeal[]
}
