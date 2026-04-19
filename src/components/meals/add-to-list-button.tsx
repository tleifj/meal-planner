"use client"

import { useState, useTransition } from "react"
import { ShoppingCart } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { addMealToListAction } from "@/lib/actions/meals"

export function AddToListButton({
  mealId,
  lists,
}: {
  mealId: string
  lists: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()

  function choose(listId: string) {
    start(async () => {
      const res = await addMealToListAction({ list_id: listId, meal_id: mealId })
      if (res.error) toast.error(res.error)
      else {
        toast.success("Added to list")
        setOpen(false)
      }
    })
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="h-12 w-full"
        disabled={pending || lists.length === 0}
      >
        <ShoppingCart className="size-4" />
        {lists.length === 0 ? "No active lists" : "Add to a list"}
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[70dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Pick a list</DrawerTitle>
            <DrawerDescription>
              Ingredients merge with matching items.
            </DrawerDescription>
          </DrawerHeader>
          <ul className="divide-border mx-4 mb-4 divide-y overflow-y-auto rounded-xl border">
            {lists.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => choose(l.id)}
                  disabled={pending}
                  className="hover:bg-muted/50 flex min-h-12 w-full items-center px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                >
                  {l.name}
                </button>
              </li>
            ))}
          </ul>
        </DrawerContent>
      </Drawer>
    </>
  )
}
