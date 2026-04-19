import Link from "next/link"
import { SignupForm } from "./signup-form"

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-muted-foreground text-sm">
          Start planning meals with your family
        </p>
      </div>
      <SignupForm />
      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground font-medium underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
