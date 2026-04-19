import { AppHeader } from "@/components/nav/app-header"
import { NewListForm } from "./form"

export default function NewListPage() {
  return (
    <>
      <AppHeader title="New list" backHref="/lists" />
      <div className="flex-1 px-5 py-6">
        <NewListForm />
      </div>
    </>
  )
}
