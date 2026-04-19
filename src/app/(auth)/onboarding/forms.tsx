"use client"

import { useActionState } from "react"
import {
  createFamilyAction,
  joinFamilyAction,
  type FamilyState,
} from "@/app/(auth)/family-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TabsContent } from "@/components/ui/tabs"

export function OnboardingForms() {
  const [createState, createAction, createPending] = useActionState<FamilyState, FormData>(
    createFamilyAction,
    undefined
  )
  const [joinState, joinAction, joinPending] = useActionState<FamilyState, FormData>(
    joinFamilyAction,
    undefined
  )

  return (
    <>
      <TabsContent value="create" className="mt-4">
        <form action={createAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Family name</Label>
            <Input
              id="name"
              name="name"
              placeholder="The Smiths"
              required
              className="h-11"
            />
          </div>
          {createState?.error ? (
            <p className="text-destructive text-sm">{createState.error}</p>
          ) : null}
          <Button type="submit" className="h-11 w-full" disabled={createPending}>
            {createPending ? "Creating…" : "Create family"}
          </Button>
        </form>
      </TabsContent>
      <TabsContent value="join" className="mt-4">
        <form action={joinAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Invite code</Label>
            <Input
              id="code"
              name="code"
              placeholder="e.g. ABCD2345"
              autoCapitalize="characters"
              autoComplete="off"
              required
              className="h-11 tracking-widest uppercase"
            />
          </div>
          {joinState?.error ? (
            <p className="text-destructive text-sm">{joinState.error}</p>
          ) : null}
          <Button type="submit" className="h-11 w-full" disabled={joinPending}>
            {joinPending ? "Joining…" : "Join family"}
          </Button>
        </form>
      </TabsContent>
    </>
  )
}
