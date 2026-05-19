"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/predictions", emoji: "🎯", text: "Quiniela" },
  { href: "/leaderboard", emoji: "🏆", text: "Posiciones" },
  { href: "/matches", emoji: "⚽", text: "Partidos" },
  { href: "/equipos", emoji: "🌍", text: "Equipos" },
  { href: "/bracket", emoji: "🗂️", text: "Bracket" },
]

const allLinks = [
  { href: "/predictions", emoji: "🎯", label: "Quiniela" },
  { href: "/leaderboard", emoji: "🏆", label: "Posiciones" },
  { href: "/matches", emoji: "⚽", label: "Partidos" },
  { href: "/equipos", emoji: "🌍", label: "Equipos" },
  { href: "/bracket", emoji: "🗂️", label: "Bracket" },
  { href: "/estadisticas", emoji: "📊", label: "Estadísticas" },
  { href: "/instrucciones", emoji: "ℹ️", label: "Info" },
]

const desktopLinks = allLinks.map((l) => ({ href: l.href, label: `${l.emoji} ${l.label}` }))

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
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      {/* Top bar */}
      <nav className="sticky top-0 z-50 border-b border-foreground/10 bg-background/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-3 h-14">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl">⚽</span>
            <span className="font-display font-bold text-foreground text-lg leading-none hidden sm:block tracking-tight">
              MUNDIAL <span style={{ color: "#fecc02" }}>2026</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-1 flex-1">
            {desktopLinks.map((link) => (
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

          {/* Spacer on mobile */}
          <div className="flex-1 sm:hidden" />

          {/* User + controls */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #8b1a2f, #c0392b)" }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-muted-foreground max-w-[120px] truncate">
                {displayName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="hidden sm:block text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-foreground/5"
            >
              Salir
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              className="sm:hidden flex flex-col items-center justify-center w-9 h-9 rounded-lg hover:bg-foreground/8 transition-colors gap-[5px]"
            >
              <span className={cn("block w-5 h-[1.5px] bg-foreground/70 transition-all origin-center", menuOpen && "rotate-45 translate-y-[6.5px]")} />
              <span className={cn("block w-5 h-[1.5px] bg-foreground/70 transition-all", menuOpen && "opacity-0")} />
              <span className={cn("block w-5 h-[1.5px] bg-foreground/70 transition-all origin-center", menuOpen && "-rotate-45 -translate-y-[6.5px]")} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-foreground/10 bg-background/98 backdrop-blur-md">
            <div className="px-4 py-3 flex flex-col gap-1">
              {allLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-primary/15 text-foreground border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
                  )}
                >
                  <span className="text-base w-6 text-center">{link.emoji}</span>
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin/matches"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    pathname.startsWith("/admin")
                      ? "text-yellow-500 bg-yellow-500/15 border border-yellow-500/20"
                      : "text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500/10",
                  )}
                >
                  <span className="text-base w-6 text-center">⚙️</span>
                  Admin
                </Link>
              )}
              <div className="border-t border-foreground/10 mt-1 pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2 px-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #8b1a2f, #c0392b)" }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">{displayName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-foreground/5"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-foreground/10 bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-around px-1 py-1 safe-area-bottom">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[60px] transition-colors",
                  isActive
                    ? "text-foreground bg-primary/10"
                    : "text-muted-foreground",
                )}
              >
                <span className="text-xl leading-none">{link.emoji}</span>
                <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                  {link.text}
                </span>
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              href="/admin/matches"
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[60px] transition-colors",
                pathname.startsWith("/admin")
                  ? "text-yellow-500 bg-yellow-500/10"
                  : "text-muted-foreground",
              )}
            >
              <span className="text-xl leading-none">⚙️</span>
              <span className="text-[10px] font-medium">Admin</span>
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
