import type { SupabaseClient } from "@supabase/supabase-js"

export type GroceryList = {
  id: string
  name: string
  created_at: string
  archived_at: string | null
}

export type GroceryListItem = {
  id: string
  list_id: string
  library_item_id: string
  quantity: number
  unit: string | null
  note: string | null
  checked: boolean
  checked_by: string | null
  checked_at: string | null
  added_by: string | null
  created_at: string
  library_item: {
    id: string
    name: string
    category_id: number
    default_unit: string | null
    is_global: boolean
  }
  category: {
    id: number
    slug: string
    name: string
    sort_order: number
    icon: string | null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchLists(supabase: SupabaseClient<any>, familyId: string) {
  const { data, error } = await supabase
    .from("grocery_lists")
    .select("id, name, created_at, archived_at")
    .eq("family_id", familyId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as GroceryList[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchListById(supabase: SupabaseClient<any>, id: string) {
  const { data, error } = await supabase
    .from("grocery_lists")
    .select("id, name, family_id, created_at, archived_at")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchListItems(supabase: SupabaseClient<any>, listId: string) {
  const { data, error } = await supabase
    .from("grocery_list_items")
    .select(
      `id, list_id, library_item_id, quantity, unit, note, checked, checked_by, checked_at, added_by, created_at,
       library_item:grocery_library_items!inner (
         id, name, category_id, default_unit, is_global,
         category:grocery_categories!inner ( id, slug, name, sort_order, icon )
       )`
    )
    .eq("list_id", listId)
    .order("created_at", { ascending: true })
  if (error) throw error

  // Flatten category to the row level for convenience.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    ...r,
    category: r.library_item.category,
    library_item: {
      id: r.library_item.id,
      name: r.library_item.name,
      category_id: r.library_item.category_id,
      default_unit: r.library_item.default_unit,
      is_global: r.library_item.is_global,
    },
  })) as GroceryListItem[]
}
