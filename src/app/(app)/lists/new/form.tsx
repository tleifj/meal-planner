"use client"

import { useTransition, useState } from "react"
import { createListAction } from "@/lib/actions/lists"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function NewListForm() {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="space-y-4"
      action={(fd) => {
        setError(null)
        start(async () => {
          const result = await createListAction(fd)
          if (result?.error) setError(result.error)
        })
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="name">List name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Weekly shop"
          required
          autoFocus
          className="h-11"
        />
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Creating…" : "Create list"}
      </Button>
    </form>
  )
}
