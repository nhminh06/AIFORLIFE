"use client"

import { Fragment } from "react"

export function Highlighted({ text }: { text: string }) {
  const parts = text.split("**")
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <Fragment key={i}>
            <mark className="rounded bg-amber-200/70 px-1 font-semibold text-amber-900">{p}</mark>
          </Fragment>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        )
      )}
    </>
  )
}
