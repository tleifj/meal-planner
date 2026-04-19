import { redirect } from "next/navigation"
import { AppHeader } from "@/components/nav/app-header"
import { createClient } from "@/lib/supabase/server"
import {
  fetchOrCreateWeekPlan,
  fetchPlanMeals,
  weekStartISO,
} from "@/lib/queries/plan"
import { fetchMeals, fetchActiveLists } from "@/lib/queries/meals"
import { WeekPlanner } from "@/components/plan/week-planner"

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/login")
  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (!profile?.family_id) redirect("/onboarding")
  const familyId = profile.family_id as string

  const weekStart = weekStartISO()
  const plan = await fetchOrCreateWeekPlan(supabase, familyId, auth.user.id, weekStart)
  const [planMeals, meals, lists] = await Promise.all([
    fetchPlanMeals(supabase, plan.id),
    fetchMeals(supabase, familyId),
    fetchActiveLists(supabase, familyId),
  ])

  return (
    <>
      <AppHeader title="Meal plan" />
      <WeekPlanner
        planId={plan.id}
        weekStart={weekStart}
        planMeals={planMeals}
        meals={meals.map((m) => ({ id: m.id, name: m.name }))}
        lists={lists}
      />
    </>
  )
}
