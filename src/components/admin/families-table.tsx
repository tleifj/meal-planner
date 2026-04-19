"use client"

import { useState, useTransition } from "react"
import { ChevronDown, ShieldCheck, Trash2, UserMinus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { setUserRoleAction, deleteFamilyAction } from "@/lib/actions/admin"

type User = {
  id: string
  display_name: string | null
  role: "member" | "admin"
}
type Family = {
  id: string
  name: string
  invite_code: string
  users: User[]
}

export function FamiliesTable({ families }: { families: Family[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [pending, start] = useTransition()

  function toggle(id: string) {
    setOpen((curr) => {
      const copy = new Set(curr)
      if (copy.has(id)) copy.delete(id)
      else copy.add(id)
      return copy
    })
  }

  function setRole(userId: string, role: "member" | "admin") {
    start(async () => {
      const res = await setUserRoleAction(userId, role)
      if (res.error) toast.error(res.error)
      else toast.success(role === "admin" ? "Promoted" : "Demoted")
    })
  }

  function removeFamily(id: string) {
    if (
      !confirm(
        "Delete this family? All their meals, lists, and plans will be removed."
      )
    )
      return
    start(async () => {
      try {
        await deleteFamilyAction(id)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  if (families.length === 0) {
    return (
      <div className="border-border bg-muted/30 text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
        No families.
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {families.map((fam) => {
        const isOpen = open.has(fam.id)
        return (
          <li key={fam.id} className="overflow-hidden rounded-xl border">
            <button
              type="button"
              onClick={() => toggle(fam.id)}
              className="hover:bg-muted/50 flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left"
            >
              <div className="flex-1">
                <div className="text-sm font-medium">{fam.name}</div>
                <div className="text-muted-foreground text-xs">
                  {fam.users.length} member{fam.users.length === 1 ? "" : "s"} · code{" "}
                  <span className="font-mono">{fam.invite_code}</span>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "text-muted-foreground size-4 transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            {isOpen ? (
              <div className="space-y-1 border-t px-2 py-2">
                {fam.users.map((u) => (
                  <div
                    key={u.id}
                    className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-1.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">
                        {u.display_name ?? "—"}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {u.role === "admin" ? "Admin" : "Member"}
                      </div>
                    </div>
                    {u.role === "admin" ? (
                      <button
                        type="button"
                        onClick={() => setRole(u.id, "member")}
                        disabled={pending}
                        className="text-muted-foreground hover:text-foreground flex h-9 items-center gap-1 rounded-full px-3 text-xs font-medium"
                      >
                        <UserMinus className="size-3.5" />
                        Demote
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRole(u.id, "admin")}
                        disabled={pending}
                        className="text-muted-foreground hover:text-foreground flex h-9 items-center gap-1 rounded-full px-3 text-xs font-medium"
                      >
                        <ShieldCheck className="size-3.5" />
                        Promote
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => removeFamily(fam.id)}
                  disabled={pending}
                  className="text-destructive hover:bg-destructive/10 flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-sm"
                >
                  <Trash2 className="size-4" />
                  Delete family
                </button>
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
