"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { deleteMealAction } from "@/lib/actions/meals"

export function DeleteMealButton({ mealId }: { mealId: string }) {
  const [pending, start] = useTransition()
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this meal?")) return
        start(async () => {
          try {
            await deleteMealAction(mealId)
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed")
          }
        })
      }}
      className="text-destructive hover:text-destructive h-11 w-full justify-start px-2"
    >
      <Trash2 className="size-4" />
      Delete meal
    </Button>
  )
}
