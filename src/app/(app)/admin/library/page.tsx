import { AppHeader } from "@/components/nav/app-header"
import { createAdminClient } from "@/lib/supabase/admin"
import { LibraryTable } from "@/components/admin/library-table"

export default async function AdminLibraryPage() {
  const admin = createAdminClient()
  const [{ data: items }, { data: categories }] = await Promise.all([
    admin
      .from("grocery_library_items")
      .select("id, name, category_id, default_unit")
      .eq("is_global", true)
      .order("name"),
    admin
      .from("grocery_categories")
      .select("id, name, sort_order")
      .order("sort_order"),
  ])

  return (
    <>
      <AppHeader title="Global library" backHref="/admin" />
      <div className="flex-1 px-4 py-3">
        <LibraryTable
          items={items ?? []}
          categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>
    </>
  )
}
