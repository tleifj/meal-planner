import { notFound, redirect } from "next/navigation"
import { AppHeader } from "@/components/nav/app-header"
import { createClient } from "@/lib/supabase/server"
import {
  fetchMealById,
  fetchMealIngredients,
  getSignedMealImageUrl,
} from "@/lib/queries/meals"
import { MealForm } from "@/components/meals/meal-form"

export default async function EditMealPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  const meal = await fetchMealById(supabase, id)
  if (!meal) notFound()

  const [ingredients, imageUrl, { data: categories }, { data: library }] =
    await Promise.all([
      fetchMealIngredients(supabase, id),
      getSignedMealImageUrl(supabase, meal.image_path),
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
      <AppHeader title="Edit meal" backHref={`/meals/${id}`} />
      <MealForm
        familyId={familyId}
        categories={categories ?? []}
        library={library ?? []}
        initial={{
          id: meal.id,
          name: meal.name,
          description: meal.description,
          image_path: meal.image_path,
          image_url: imageUrl,
          family_id: meal.family_id,
          ingredients: ingredients.map((i) => ({
            id: i.id,
            library_item_id: i.library_item_id,
            quantity: Number(i.quantity),
            unit: i.unit,
            default_unit: i.library_item.default_unit,
            name: i.library_item.name,
            category_id: i.library_item.category_id,
          })),
        }}
      />
    </>
  )
}
