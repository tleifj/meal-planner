import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus } from "lucide-react"
import { AppHeader } from "@/components/nav/app-header"
import { createClient } from "@/lib/supabase/server"
import {
  fetchMeals,
  getSignedMealImageUrl,
  fetchFavoriteMealIds,
} from "@/lib/queries/meals"
import { MealsGrid } from "@/components/meals/meals-grid"

export default async function MealsPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/login")
  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (!profile?.family_id) redirect("/onboarding")

  const [meals, favIds] = await Promise.all([
    fetchMeals(supabase, profile.family_id),
    fetchFavoriteMealIds(supabase, auth.user.id),
  ])
  const withUrls = await Promise.all(
    meals.map(async (m) => ({
      id: m.id,
      name: m.name,
      image_url: await getSignedMealImageUrl(supabase, m.image_path),
      favorited: favIds.has(m.id),
    }))
  )

  return (
    <>
      <AppHeader
        title="Meals"
        right={
          <Link
            href="/meals/new"
            aria-label="New meal"
            className="hover:bg-muted flex size-10 items-center justify-center rounded-full"
          >
            <Plus className="size-5" />
          </Link>
        }
      />
      <div className="flex-1 px-4 py-3">
        {withUrls.length === 0 ? (
          <EmptyState />
        ) : (
          <MealsGrid meals={withUrls} />
        )}
      </div>
    </>
  )
}

function EmptyState() {
  return (
    <div className="border-border bg-muted/30 text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
      <p className="text-sm">No meals yet.</p>
      <Link
        href="/meals/new"
        className="bg-foreground text-background inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium"
      >
        <Plus className="size-4" />
        Create first meal
      </Link>
    </div>
  )
}
