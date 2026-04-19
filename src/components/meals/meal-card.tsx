import Link from "next/link"
import Image from "next/image"
import { ImageIcon } from "lucide-react"

export function MealCard({
  id,
  name,
  imageUrl,
}: {
  id: string
  name: string
  imageUrl: string | null
}) {
  return (
    <Link
      href={`/meals/${id}`}
      className="group block overflow-hidden rounded-xl border"
    >
      <div className="bg-muted relative aspect-square">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <ImageIcon className="size-8" />
          </div>
        )}
      </div>
      <div className="px-3 py-2.5">
        <div className="truncate text-sm font-medium">{name}</div>
      </div>
    </Link>
  )
}
