import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BottomNav } from "@/components/nav/bottom-nav"
import { PullToRefresh } from "@/components/pwa/pull-to-refresh"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, role")
    .eq("id", auth.user.id)
    .maybeSingle()

  if (!profile?.family_id) redirect("/onboarding")

  return (
    <div className="flex min-h-dvh flex-col">
      <PullToRefresh />
      <main className="flex flex-1 flex-col">{children}</main>
      <BottomNav isAdmin={profile.role === "admin"} />
    </div>
  )
}
