import { ArrowRight } from "lucide-react"

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-100 via-blue-50 to-white p-6 sm:p-8 lg:p-10 dark:border-slate-800 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900">
      <div className="grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Chào bạn 👋</p>
          <h1 className="mt-2 text-balance text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-[2rem]">
            Học tiếng Anh mỗi ngày để tiến gần hơn đến mục tiêu của bạn!
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-500 dark:text-slate-300 sm:text-base">
            Duy trì thói quen học tập với các bài học từ vựng, mẫu câu và ngữ
            pháp được cá nhân hoá. Chỉ 15 phút mỗi ngày là đủ để tạo nên khác
            biệt.
          </p>
          <button
            type="button"
            className="group mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            Bắt đầu học ngay
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <div className="relative hidden justify-end lg:flex">
          <img
            src="/images/hero-illustration.png"
            alt="Minh hoạ nhân vật đeo tai nghe học tiếng Anh trên laptop với tháp Big Ben phía sau"
            className="h-56 w-auto rounded-2xl object-contain drop-shadow-sm dark:brightness-95 dark:contrast-105"
          />
        </div>
      </div>
    </section>
  )
}

