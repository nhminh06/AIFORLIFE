import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

type PageHeadingProps = {
  icon: LucideIcon
  title: string
  desc?: string
  bubbleClass?: string
  children?: ReactNode
}

export function PageHeading({
  icon: Icon,
  title,
  desc,
  bubbleClass = "bg-blue-600",
  children,
}: PageHeadingProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bubbleClass} text-white shadow-sm`}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {desc && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
              {desc}
            </p>
          )}
        </div>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  )
}
