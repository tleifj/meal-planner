"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function assertAdmin() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/login")
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (profile?.role !== "admin") throw new Error("Forbidden")
  return supabase
}

const libSchema = z.object({
  name: z.string().min(1).max(80),
  category_id: z.coerce.number().int().positive(),
  default_unit: z.string().max(16).nullable().optional(),
})

export async function createLibraryItemAction(formData: FormData) {
  await assertAdmin()
  const parsed = libSchema.safeParse({
    name: formData.get("name"),
    category_id: formData.get("category_id"),
    default_unit: formData.get("default_unit") || null,
  })
  if (!parsed.success) return { error: "Invalid" }

  const supabase = await createClient()
  const { error } = await supabase.from("grocery_library_items").insert({
    name: parsed.data.name,
    category_id: parsed.data.category_id,
    default_unit: parsed.data.default_unit ?? null,
    is_global: true,
    family_id: null,
  })
  if (error) return { error: error.message }
  revalidatePath("/admin/library")
  return { error: null }
}

export async function updateLibraryItemAction(input: {
  id: string
  name: string
  category_id: number
  default_unit: string | null
}) {
  await assertAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from("grocery_library_items")
    .update({
      name: input.name,
      category_id: input.category_id,
      default_unit: input.default_unit,
    })
    .eq("id", input.id)
  if (error) return { error: error.message }
  revalidatePath("/admin/library")
  return { error: null }
}

export async function deleteLibraryItemAction(id: string) {
  await assertAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from("grocery_library_items").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/library")
}

export async function setUserRoleAction(userId: string, role: "member" | "admin") {
  await assertAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId)
  if (error) return { error: error.message }
  revalidatePath("/admin/families")
  return { error: null }
}

export async function deleteFamilyAction(familyId: string) {
  await assertAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from("families").delete().eq("id", familyId)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/families")
}
