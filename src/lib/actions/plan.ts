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

const addSchema = z.object({
  plan_id: z.string().uuid(),
  meal_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6).nullable(),
  servings_multiplier: z.number().positive().default(1),
})

export async function addPlanMealAction(input: {
  plan_id: string
  meal_id: string
  day_of_week: number | null
  servings_multiplier?: number
}) {
  const parsed = addSchema.safeParse({
    ...input,
    servings_multiplier: input.servings_multiplier ?? 1,
  })
  if (!parsed.success) return { error: "Invalid" }

  const { supabase } = await currentFamilyId()
  const { error } = await supabase.from("meal_plan_meals").insert({
    plan_id: parsed.data.plan_id,
    meal_id: parsed.data.meal_id,
    day_of_week: parsed.data.day_of_week,
    servings_multiplier: parsed.data.servings_multiplier,
  })
  if (error) return { error: error.message }

  revalidatePath("/plan")
  return { error: null }
}

export async function removePlanMealAction(id: string) {
  const { supabase } = await currentFamilyId()
  const { error } = await supabase.from("meal_plan_meals").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/plan")
}

export async function flushPlanAction(input: { plan_id: string; list_id: string }) {
  const { supabase } = await currentFamilyId()

  const { data: unflushed, error: fetchErr } = await supabase
    .from("meal_plan_meals")
    .select("id, meal_id, servings_multiplier")
    .eq("plan_id", input.plan_id)
    .is("added_to_list_at", null)
  if (fetchErr) return { error: fetchErr.message, count: 0 }
  if (!unflushed || unflushed.length === 0) return { error: null, count: 0 }

  for (const row of unflushed) {
    const { error: rpcErr } = await supabase.rpc("add_meal_to_list", {
      p_list_id: input.list_id,
      p_meal_id: row.meal_id,
      p_mult: Number(row.servings_multiplier),
    })
    if (rpcErr) return { error: rpcErr.message, count: 0 }
  }

  const now = new Date().toISOString()
  const ids = unflushed.map((r) => r.id)
  const { error: updErr } = await supabase
    .from("meal_plan_meals")
    .update({ added_to_list_at: now })
    .in("id", ids)
  if (updErr) return { error: updErr.message, count: 0 }

  revalidatePath(`/lists/${input.list_id}`)
  revalidatePath("/plan")
  return { error: null, count: unflushed.length }
}
