import Link from "next/link"
import { LoginForm } from "./login-form"

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to your meal planner
        </p>
      </div>
      <LoginForm />
      <p className="text-muted-foreground text-center text-sm">
        New here?{" "}
        <Link href="/signup" className="text-foreground font-medium underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
