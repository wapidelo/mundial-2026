"use client"

export function LocalDateTime({
  iso,
  options,
  className,
}: {
  iso: string
  options?: Intl.DateTimeFormatOptions
  className?: string
}) {
  return (
    <span className={className} suppressHydrationWarning>
      {new Date(iso).toLocaleDateString("es-MX", options)}
    </span>
  )
}
