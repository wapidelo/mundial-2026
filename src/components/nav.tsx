"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const links = [
  { href: "/predictions", label: "🎯 Predicciones" },
  { href: "/leaderboard", label: "🏆 Posiciones" },
  { href: "/matches", label: "⚽ Partidos" },
  { href: "/estadisticas", label: "📊 Estadísticas" },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="w-8 h-7" />

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="text-sm px-2 py-1 rounded hover:bg-foreground/5 transition-colors text-muted-foreground hover:text-foreground"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  )
}

export function Nav({
  displayName,
  isAdmin,
}: {
  displayName: string
  isAdmin: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-foreground/10 bg-background/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-6 h-14">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
          <span className="text-xl">⚽</span>
          <span className="font-bold text-foreground text-sm hidden sm:block">
            Mundial <span style={{ color: "#fecc02" }}>2026</span>
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1 flex-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-primary/20 text-foreground border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin/matches"
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "text-yellow-600 dark:text-yellow-300 bg-yellow-500/20 border border-yellow-500/30"
                  : "text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-300 hover:bg-yellow-500/10",
              )}
            >
              ⚙️ Admin
            </Link>
          )}
        </div>

        {/* User + Theme toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #8b1a2f, #c0392b)" }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-muted-foreground max-w-[120px] truncate">
              {displayName}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-foreground/5"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
