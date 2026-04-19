import Link from "next/link"
import Image from "next/image"
import { notFound, redirect } from "next/navigation"
import { Pencil } from "lucide-react"
import { AppHeader } from "@/components/nav/app-header"
import { createClient } from "@/lib/supabase/server"
import {
  fetchMealById,
  fetchMealIngredients,
  getSignedMealImageUrl,
  fetchActiveLists,
  fetchFavoriteMealIds,
} from "@/lib/queries/meals"
import { AddToListButton } from "@/components/meals/add-to-list-button"
import { DeleteMealButton } from "@/components/meals/delete-meal-button"
import { FavoriteButton } from "@/components/meals/favorite-button"

export default async function MealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/login")

  const meal = await fetchMealById(supabase, id)
  if (!meal) notFound()

  const [ingredients, imageUrl, lists, favIds] = await Promise.all([
    fetchMealIngredients(supabase, id),
    getSignedMealImageUrl(supabase, meal.image_path),
    fetchActiveLists(supabase, meal.family_id),
    fetchFavoriteMealIds(supabase, auth.user.id),
  ])
  const favorited = favIds.has(id)

  return (
    <>
      <AppHeader
        title={meal.name}
        backHref="/meals"
        right={
          <Link
            href={`/meals/${id}/edit`}
            aria-label="Edit meal"
            className="hover:bg-muted flex size-10 items-center justify-center rounded-full"
          >
            <Pencil className="size-5" />
          </Link>
        }
      />
      <div className="flex-1 px-4 pb-28 pt-3">
        {imageUrl ? (
          <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-xl">
            <Image
              src={imageUrl}
              alt={meal.name}
              fill
              sizes="(max-width: 640px) 100vw, 640px"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : null}

        <div className="mt-4">
          <FavoriteButton mealId={id} favorited={favorited} variant="pill" />
        </div>

        {meal.description ? (
          <p className="text-muted-foreground mt-4 whitespace-pre-wrap text-sm">
            {meal.description}
          </p>
        ) : null}

        <div className="mt-5">
          <h2 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
            Ingredients
          </h2>
          {ingredients.length === 0 ? (
            <div className="border-border bg-muted/30 text-muted-foreground rounded-xl border border-dashed p-6 text-center text-xs">
              No ingredients.
            </div>
          ) : (
            <ul className="divide-border divide-y overflow-hidden rounded-xl border">
              {ingredients.map((ing) => (
                <li
                  key={ing.id}
                  className="flex min-h-12 items-center justify-between px-4 py-2.5 text-sm"
                >
                  <span className="truncate font-medium">{ing.library_item.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {Number(ing.quantity) % 1 === 0
                      ? Number(ing.quantity)
                      : Number(ing.quantity).toFixed(2).replace(/\.?0+$/, "")}
                    {ing.unit || ing.library_item.default_unit
                      ? ` ${ing.unit ?? ing.library_item.default_unit}`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6">
          <DeleteMealButton mealId={id} />
        </div>
      </div>

      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-16 z-20 border-t px-4 py-3 backdrop-blur">
        <AddToListButton mealId={id} lists={lists} />
      </div>
    </>
  )
}
