"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

export function WelcomeToast() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const name = searchParams.get("bienvenida")

  useEffect(() => {
    if (!name) return
    toast.success(`¡Bienvenido, ${name}!`, {
      description: "Ya puedes registrar tus predicciones.",
      duration: 6000,
    })
    const url = new URL(window.location.href)
    url.searchParams.delete("bienvenida")
    router.replace(url.pathname, { scroll: false })
  }, [name]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
