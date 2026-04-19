"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const STORAGE_KEY = "meals.install-dismissed"

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) return
    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setEvt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1")
    setShow(false)
  }

  async function install() {
    if (!evt) return
    await evt.prompt()
    const result = await evt.userChoice
    if (result.outcome !== "dismissed") {
      dismiss()
    } else {
      setShow(false)
    }
  }

  if (!show || !evt) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="bg-background pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border p-3 shadow-lg">
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
          <Download className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">Install Meals</div>
          <div className="text-muted-foreground truncate text-xs">
            Add to your home screen.
          </div>
        </div>
        <Button type="button" size="sm" onClick={install} className="h-9">
          Install
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-full"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
