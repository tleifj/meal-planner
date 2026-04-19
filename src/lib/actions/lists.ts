"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

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

const createListSchema = z.object({ name: z.string().min(1).max(80) })
const addLibrarySchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  name: z.string().min(1).max(80),
})
const addToListSchema = z.object({
  listId: z.string().uuid(),
  libraryItemId: z.string().uuid(),
  quantity: z.coerce.number().positive().default(1),
})

export async function createListAction(formData: FormData) {
  const parsed = createListSchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) return { error: "Name is required" }

  const { supabase, familyId, userId } = await currentFamilyId()
  const { data, error } = await supabase
    .from("grocery_lists")
    .insert({ family_id: familyId, name: parsed.data.name, created_by: userId })
    .select("id")
    .single()
  if (error) return { error: error.message }

  revalidatePath("/lists")
  redirect(`/lists/${data.id}`)
}

export async function archiveListAction(listId: string) {
  const { supabase } = await currentFamilyId()
  const { error } = await supabase
    .from("grocery_lists")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", listId)
  if (error) throw new Error(error.message)
  revalidatePath("/lists")
}

export async function addLibraryItemAction(formData: FormData) {
  const parsed = addLibrarySchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
  })
  if (!parsed.success) return { error: "Name and category required", id: null }

  const { supabase, familyId, userId } = await currentFamilyId()
  const { data, error } = await supabase
    .from("grocery_library_items")
    .insert({
      name: parsed.data.name,
      category_id: parsed.data.categoryId,
      is_global: false,
      family_id: familyId,
      created_by: userId,
    })
    .select("id, name, category_id, default_unit, is_global")
    .single()
  if (error) return { error: error.message, id: null }
  return { id: data.id, error: null }
}

export async function addToGroceryListAction(formData: FormData) {
  const parsed = addToListSchema.safeParse({
    listId: formData.get("listId"),
    libraryItemId: formData.get("libraryItemId"),
    quantity: formData.get("quantity") ?? 1,
  })
  if (!parsed.success) return { error: "Invalid input" }

  const { supabase } = await currentFamilyId()
  const { error } = await supabase.rpc("add_to_grocery_list", {
    p_list_id: parsed.data.listId,
    p_library_item_id: parsed.data.libraryItemId,
    p_quantity: parsed.data.quantity,
  })
  if (error) return { error: error.message }

  revalidatePath(`/lists/${parsed.data.listId}`)
  return { error: null }
}

export async function toggleCheckedAction(itemId: string, checked: boolean) {
  const { supabase, userId } = await currentFamilyId()
  const { error } = await supabase
    .from("grocery_list_items")
    .update({
      checked,
      checked_at: checked ? new Date().toISOString() : null,
      checked_by: checked ? userId : null,
    })
    .eq("id", itemId)
  if (error) throw new Error(error.message)
}

export async function deleteListItemAction(itemId: string) {
  const { supabase } = await currentFamilyId()
  const { error } = await supabase.from("grocery_list_items").delete().eq("id", itemId)
  if (error) throw new Error(error.message)
}

export async function updateQuantityAction(itemId: string, quantity: number) {
  const { supabase } = await currentFamilyId()
  const { error } = await supabase
    .from("grocery_list_items")
    .update({ quantity })
    .eq("id", itemId)
  if (error) throw new Error(error.message)
}
