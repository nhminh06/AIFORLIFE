"use client"

import { useEffect, useState } from "react"

import { SearchButton } from "./search-button-icon"
import { SearchModal } from "./search-modal"

export function GlobalSearch() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <SearchButton onOpen={() => setOpen(true)} />
      {open && <SearchModal onClose={() => setOpen(false)} />}
    </>
  )
}


