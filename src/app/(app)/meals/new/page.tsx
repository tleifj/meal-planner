import { redirect } from "next/navigation"
import { AppHeader } from "@/components/nav/app-header"
import { createClient } from "@/lib/supabase/server"
import { MealForm } from "@/components/meals/meal-form"

export default async function NewMealPage() {
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

  const [{ data: categories }, { data: library }] = await Promise.all([
    supabase
      .from("grocery_categories")
      .select("id, slug, name, sort_order, icon")
      .order("sort_order"),
    supabase
      .from("grocery_library_items")
      .select("id, name, category_id, default_unit, is_global")
      .or(`is_global.eq.true,family_id.eq.${familyId}`)
      .order("name"),
  ])

  return (
    <>
      <AppHeader title="New meal" backHref="/meals" />
      <MealForm
        familyId={familyId}
        categories={categories ?? []}
        library={library ?? []}
      />
    </>
  )
}
