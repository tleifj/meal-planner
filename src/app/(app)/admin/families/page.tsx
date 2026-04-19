import { AppHeader } from "@/components/nav/app-header"
import { createAdminClient } from "@/lib/supabase/admin"
import { FamiliesTable } from "@/components/admin/families-table"

export default async function AdminFamiliesPage() {
  const admin = createAdminClient()

  const [{ data: families }, { data: profiles }] = await Promise.all([
    admin
      .from("families")
      .select("id, name, invite_code, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("profiles")
      .select("id, display_name, role, family_id"),
  ])

  const profilesByFamily = new Map<
    string,
    { id: string; display_name: string | null; role: "member" | "admin" }[]
  >()
  for (const p of profiles ?? []) {
    if (!p.family_id) continue
    if (!profilesByFamily.has(p.family_id)) profilesByFamily.set(p.family_id, [])
    profilesByFamily.get(p.family_id)!.push({
      id: p.id,
      display_name: p.display_name,
      role: p.role,
    })
  }

  const enriched = (families ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    invite_code: f.invite_code,
    users: profilesByFamily.get(f.id) ?? [],
  }))

  const orphans = (profiles ?? []).filter((p) => !p.family_id)

  return (
    <>
      <AppHeader title="Families" backHref="/admin" />
      <div className="flex-1 space-y-5 px-4 py-3">
        <FamiliesTable families={enriched} />
        {orphans.length > 0 ? (
          <section>
            <h2 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
              Unassigned users ({orphans.length})
            </h2>
            <ul className="divide-border divide-y overflow-hidden rounded-xl border">
              {orphans.map((u) => (
                <li
                  key={u.id}
                  className="flex min-h-12 items-center gap-3 px-4 py-2.5"
                >
                  <div className="flex-1 text-sm">
                    {u.display_name ?? "—"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {u.role === "admin" ? "Admin" : "Member"}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  )
}
