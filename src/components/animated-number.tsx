"use client"

import { useEffect, useRef, useState } from "react"

export function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number>(undefined)

  useEffect(() => {
    const start = Date.now()
    const duration = 900

    function tick() {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value])

  return <>{display}</>
}
