import { redirect } from "next/navigation"
import { AppHeader } from "@/components/nav/app-header"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/(auth)/actions"
import { SettingsFamilyCard } from "./family-card"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/login")

  const [{ data: profile }, { data: family }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, role, family_id")
      .eq("id", auth.user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("family_id, families:family_id ( id, name, invite_code )")
      .eq("id", auth.user.id)
      .maybeSingle(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fam = (family as any)?.families as
    | { id: string; name: string; invite_code: string }
    | null
    | undefined

  return (
    <>
      <AppHeader title="Settings" />
      <div className="flex-1 space-y-5 px-4 py-5">
        <section className="space-y-2 rounded-xl border p-4">
          <div className="text-muted-foreground text-xs font-semibold uppercase">Profile</div>
          <div className="text-lg font-medium">{profile?.display_name ?? ""}</div>
          <div className="text-muted-foreground text-sm">{auth.user.email}</div>
          {profile?.role === "admin" ? (
            <div className="bg-muted inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
              Admin
            </div>
          ) : null}
        </section>

        {fam ? <SettingsFamilyCard family={fam} /> : null}

        <form action={signOut}>
          <Button type="submit" variant="outline" className="h-11 w-full">
            Sign out
          </Button>
        </form>
      </div>
    </>
  )
}
