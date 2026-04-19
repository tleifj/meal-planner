"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ListChecks, UtensilsCrossed, CalendarDays, Settings, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  match: (path: string) => boolean
}

const TABS: Tab[] = [
  { href: "/lists", label: "Lists", icon: ListChecks, match: (p) => p === "/lists" || p.startsWith("/lists/") },
  { href: "/meals", label: "Meals", icon: UtensilsCrossed, match: (p) => p.startsWith("/meals") },
  { href: "/plan", label: "Plan", icon: CalendarDays, match: (p) => p.startsWith("/plan") },
  { href: "/settings", label: "Settings", icon: Settings, match: (p) => p.startsWith("/settings") },
]

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const tabs: Tab[] = isAdmin
    ? [
        ...TABS,
        {
          href: "/admin",
          label: "Admin",
          icon: ShieldCheck,
          match: (p) => p.startsWith("/admin"),
        },
      ]
    : TABS

  return (
    <nav
      className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-40 border-t backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname ?? "")
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                className={cn(
                  "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("size-5", active && "stroke-[2.2]")} />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
