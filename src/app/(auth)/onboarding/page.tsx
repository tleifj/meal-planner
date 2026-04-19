import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OnboardingForms } from "./forms"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", auth.user.id)
    .maybeSingle()
  if (profile?.family_id) redirect("/lists")

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Set up your family</h1>
        <p className="text-muted-foreground text-sm">
          Create one or join with an invite code
        </p>
      </div>
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="join">Join</TabsTrigger>
        </TabsList>
        <OnboardingForms />
      </Tabs>
    </div>
  )
}
