"use client"

import { useActionState } from "react"
import { joinFamilyAction, type FamilyState } from "@/app/(auth)/family-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function JoinFormWithCode({ initialCode }: { initialCode: string }) {
  const [state, action, pending] = useActionState<FamilyState, FormData>(
    joinFamilyAction,
    undefined
  )

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Invite code</Label>
        <Input
          id="code"
          name="code"
          defaultValue={initialCode}
          placeholder="ABCD2345"
          autoCapitalize="characters"
          autoComplete="off"
          required
          className="h-11 tracking-widest uppercase"
        />
      </div>
      {state?.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Joining…" : "Join"}
      </Button>
    </form>
  )
}
