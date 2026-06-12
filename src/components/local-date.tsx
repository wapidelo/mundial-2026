"use client"

import { useState, useEffect } from "react"

export function LocalDateTime({
  iso,
  options,
  className,
}: {
  iso: string
  options?: Intl.DateTimeFormatOptions
  className?: string
}) {
  const [formatted, setFormatted] = useState("")

  useEffect(() => {
    setFormatted(new Date(iso).toLocaleDateString("es-MX", options))
  }, [iso])

  return <span className={className}>{formatted}</span>
}
