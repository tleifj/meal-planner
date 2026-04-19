import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { JoinFormWithCode } from "./join-form"

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    const params = await searchParams
    const code = params.code ? `?code=${encodeURIComponent(params.code)}` : ""
    redirect(`/login${code ? `?next=${encodeURIComponent(`/join${code}`)}` : ""}`)
  }

  const params = await searchParams
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Join a family</h1>
        <p className="text-muted-foreground text-sm">
          Enter the invite code shared with you
        </p>
      </div>
      <JoinFormWithCode initialCode={params.code ?? ""} />
    </div>
  )
}
