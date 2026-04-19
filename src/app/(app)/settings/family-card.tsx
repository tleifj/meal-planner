"use client"

import { useState, useTransition } from "react"
import { Copy, RefreshCw, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  leaveFamilyAction,
  regenerateInviteAction,
} from "@/app/(auth)/family-actions"

export function SettingsFamilyCard({
  family,
}: {
  family: { id: string; name: string; invite_code: string }
}) {
  const [code, setCode] = useState(family.invite_code)
  const [pending, start] = useTransition()

  async function copy() {
    await navigator.clipboard.writeText(code)
    toast.success("Invite code copied")
  }

  function regenerate() {
    start(async () => {
      try {
        await regenerateInviteAction(family.id)
        const res = await fetch(`/api/family/invite?id=${family.id}`, { cache: "no-store" })
        if (res.ok) {
          const data = (await res.json()) as { code?: string }
          if (data.code) setCode(data.code)
        }
        toast.success("New invite code generated")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed")
      }
    })
  }

  function leave() {
    if (!confirm("Leave this family? You can rejoin with an invite code.")) return
    start(async () => {
      await leaveFamilyAction(family.id)
    })
  }

  return (
    <section className="space-y-3 rounded-xl border p-4">
      <div className="text-muted-foreground text-xs font-semibold uppercase">Family</div>
      <div className="text-lg font-medium">{family.name}</div>
      <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2.5">
        <div className="text-muted-foreground text-xs">Invite code</div>
        <div className="flex-1 text-right font-mono text-sm tracking-widest">{code}</div>
        <button
          type="button"
          onClick={copy}
          className="hover:bg-background/60 flex size-8 items-center justify-center rounded-md"
          aria-label="Copy invite code"
        >
          <Copy className="size-4" />
        </button>
        <button
          type="button"
          onClick={regenerate}
          disabled={pending}
          className="hover:bg-background/60 flex size-8 items-center justify-center rounded-md disabled:opacity-50"
          aria-label="Regenerate invite code"
        >
          <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} />
        </button>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="text-destructive hover:text-destructive h-11 w-full justify-start px-2"
        onClick={leave}
        disabled={pending}
      >
        <LogOut className="size-4" />
        Leave family
      </Button>
    </section>
  )
}
