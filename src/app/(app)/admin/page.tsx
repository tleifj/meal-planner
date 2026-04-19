import Link from "next/link"
import { ChevronRight, BookOpen, Users } from "lucide-react"
import { AppHeader } from "@/components/nav/app-header"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function AdminHome() {
  const admin = createAdminClient()
  const [profiles, families, meals, lists, library] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("families").select("id", { count: "exact", head: true }),
    admin.from("meals").select("id", { count: "exact", head: true }),
    admin.from("grocery_lists").select("id", { count: "exact", head: true }),
    admin
      .from("grocery_library_items")
      .select("id", { count: "exact", head: true })
      .eq("is_global", true),
  ])

  const stats = [
    { label: "Users", value: profiles.count ?? 0 },
    { label: "Families", value: families.count ?? 0 },
    { label: "Meals", value: meals.count ?? 0 },
    { label: "Lists", value: lists.count ?? 0 },
    { label: "Global items", value: library.count ?? 0 },
  ]

  return (
    <>
      <AppHeader title="Admin" />
      <div className="flex-1 space-y-5 px-4 py-3">
        <section>
          <h2 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border p-4">
                <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
                <div className="text-muted-foreground text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
            Manage
          </h2>
          <ul className="divide-border divide-y overflow-hidden rounded-xl border">
            <li>
              <Link
                href="/admin/library"
                className="hover:bg-muted/50 flex min-h-14 items-center gap-3 px-4 py-3"
              >
                <BookOpen className="text-muted-foreground size-5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Global library</div>
                  <div className="text-muted-foreground text-xs">
                    Edit shared grocery items
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground size-4" />
              </Link>
            </li>
            <li>
              <Link
                href="/admin/families"
                className="hover:bg-muted/50 flex min-h-14 items-center gap-3 px-4 py-3"
              >
                <Users className="text-muted-foreground size-5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Families &amp; users</div>
                  <div className="text-muted-foreground text-xs">
                    Roles, membership
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground size-4" />
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </>
  )
}
