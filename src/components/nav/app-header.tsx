import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export function AppHeader({
  title,
  backHref,
  right,
  className,
}: {
  title: string
  backHref?: string
  right?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        "bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 border-b backdrop-blur",
        className
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-14 items-center gap-2 px-4">
        {backHref ? (
          <Link
            href={backHref}
            className="hover:bg-muted -ml-2 flex size-10 items-center justify-center rounded-full"
            aria-label="Back"
          >
            <ChevronLeft className="size-5" />
          </Link>
        ) : null}
        <h1 className="truncate text-base font-semibold">{title}</h1>
        <div className="ml-auto flex items-center gap-1">{right}</div>
      </div>
    </header>
  )
}
