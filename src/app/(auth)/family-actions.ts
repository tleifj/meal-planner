"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

export type FamilyState = { error?: string } | undefined

const createSchema = z.object({ name: z.string().min(1).max(60) })
const joinSchema = z.object({ code: z.string().min(4).max(16) })

export async function createFamilyAction(
  _prev: FamilyState,
  formData: FormData
): Promise<FamilyState> {
  const parsed = createSchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) return { error: "Please enter a family name" }

  const supabase = await createClient()
  const { error } = await supabase.rpc("create_family", { p_name: parsed.data.name })
  if (error) return { error: error.message }

  redirect("/lists")
}

export async function joinFamilyAction(
  _prev: FamilyState,
  formData: FormData
): Promise<FamilyState> {
  const parsed = joinSchema.safeParse({
    code: (formData.get("code") ?? "").toString().trim(),
  })
  if (!parsed.success) return { error: "Please enter an invite code" }

  const supabase = await createClient()
  const { error } = await supabase.rpc("join_family", { p_code: parsed.data.code })
  if (error) return { error: error.message }

  redirect("/lists")
}

export async function leaveFamilyAction(familyId: string) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) redirect("/login")

  await supabase
    .from("family_members")
    .delete()
    .eq("family_id", familyId)
    .eq("user_id", user.user.id)

  await supabase
    .from("profiles")
    .update({ family_id: null })
    .eq("id", user.user.id)

  redirect("/onboarding")
}

export async function regenerateInviteAction(familyId: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc("regenerate_invite_code", {
    p_family_id: familyId,
  })
  if (error) throw new Error(error.message)
}
