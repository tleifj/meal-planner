import { notFound, redirect } from "next/navigation"
import { AppHeader } from "@/components/nav/app-header"
import { createClient } from "@/lib/supabase/server"
import { fetchListById, fetchListItems } from "@/lib/queries/lists"
import { ListDetail } from "./list-detail"

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/login")

  const list = await fetchListById(supabase, id)
  if (!list) notFound()
  const [items, { data: categories }, { data: library }] = await Promise.all([
    fetchListItems(supabase, id),
    supabase
      .from("grocery_categories")
      .select("id, slug, name, sort_order, icon")
      .order("sort_order"),
    supabase
      .from("grocery_library_items")
      .select("id, name, category_id, default_unit, is_global")
      .or(`is_global.eq.true,family_id.eq.${list.family_id}`)
      .order("name"),
  ])

  return (
    <>
      <AppHeader title={list.name} backHref="/lists" />
      <ListDetail
        listId={id}
        initialItems={items}
        categories={categories ?? []}
        library={library ?? []}
      />
    </>
  )
}
