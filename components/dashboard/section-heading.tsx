import { ArrowRight, type LucideIcon } from "lucide-react"

type SectionHeadingProps = {
  icon: LucideIcon
  title: string
  action?: string
}

export function SectionHeading({ icon: Icon, title, action }: SectionHeadingProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900/5 text-slate-700">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </h2>
      {action && (
        <a
          href="#"
          className="group inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {action}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>
      )}
    </div>
  )
}
