import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, ChevronRight } from "lucide-react"
import { AppHeader } from "@/components/nav/app-header"
import { createClient } from "@/lib/supabase/server"
import { fetchLists } from "@/lib/queries/lists"
import { formatDistanceToNow } from "date-fns"

export default async function ListsPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/login")
  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (!profile?.family_id) redirect("/onboarding")

  const lists = await fetchLists(supabase, profile.family_id)

  return (
    <>
      <AppHeader
        title="Grocery Lists"
        right={
          <Link
            href="/lists/new"
            aria-label="New list"
            className="hover:bg-muted flex size-10 items-center justify-center rounded-full"
          >
            <Plus className="size-5" />
          </Link>
        }
      />
      <div className="flex-1 px-4 py-3">
        {lists.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-border divide-y overflow-hidden rounded-xl border">
            {lists.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/lists/${l.id}`}
                  className="hover:bg-muted/50 flex min-h-14 items-center gap-3 px-4 py-3"
                >
                  <div className="flex-1 truncate">
                    <div className="truncate font-medium">{l.name}</div>
                    <div className="text-muted-foreground text-xs">
                      Created {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <ChevronRight className="text-muted-foreground size-4" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function EmptyState() {
  return (
    <div className="border-border bg-muted/30 text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
      <p className="text-sm">No lists yet.</p>
      <Link
        href="/lists/new"
        className="bg-foreground text-background inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium"
      >
        <Plus className="size-4" />
        Create first list
      </Link>
    </div>
  )
}
