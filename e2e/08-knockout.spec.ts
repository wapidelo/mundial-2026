import { test, expect } from "@playwright/test"
import * as path from "path"

test.describe("Bracket Eliminatorio (pre-sembrado)", () => {
  test.describe("como usuario regular", () => {
    test.use({ storageState: path.join(__dirname, ".auth/user.json") })

    test("muestra Ronda de 32 en /predictions desde el primer día", async ({ page }) => {
      await page.goto("/predictions")
      await expect(page.getByText("Ronda de 32")).toBeVisible()
    })

    test("muestra todos los rounds eliminatorios en /predictions", async ({ page }) => {
      await page.goto("/predictions")
      await expect(page.getByText("Octavos de Final")).toBeVisible()
      await expect(page.getByText("Cuartos de Final")).toBeVisible()
      await expect(page.getByText("Semifinales")).toBeVisible()
      await expect(page.getByText("Final")).toBeVisible()
    })

    test("muestra etiquetas de posición de grupo en lugar de equipos", async ({ page }) => {
      await page.goto("/predictions")
      await expect(page.getByText("1° Grupo A").first()).toBeVisible()
    })

    test("el contador de predicciones refleja 104 partidos totales", async ({ page }) => {
      await page.goto("/predictions")
      const counter = page.locator(".font-mono").filter({ hasText: /\/104/ }).first()
      await expect(counter).toBeVisible()
    })

    test("el usuario puede ingresar una predicción para un partido eliminatorio", async ({ page }) => {
      await page.goto("/predictions")
      // R32 section should have score inputs
      const r32Section = page.locator("details").filter({ hasText: "Ronda de 32" }).first()
      await expect(r32Section).toBeVisible()
      const inputs = r32Section.locator("input[type='number']")
      await expect(inputs.first()).toBeEnabled()
    })

    test("muestra Ronda de 32 en /matches", async ({ page }) => {
      await page.goto("/matches")
      await expect(page.getByText("Ronda de 32")).toBeVisible()
    })

    test("muestra etiquetas de posición en /matches", async ({ page }) => {
      await page.goto("/matches")
      await expect(page.getByText(/1° Grupo/i).first()).toBeVisible()
    })
  })

  test.describe("como admin", () => {
    test.use({ storageState: path.join(__dirname, ".auth/admin.json") })

    test("muestra la sección Bracket Eliminatorio en admin", async ({ page }) => {
      await page.goto("/admin/matches")
      await expect(page.getByText("Bracket Eliminatorio")).toBeVisible()
    })

    test("muestra los slots de la Ronda de 32 en admin", async ({ page }) => {
      await page.goto("/admin/matches")
      await expect(page.getByText("Ronda de 32").first()).toBeVisible()
    })

    test("muestra los selects para asignar equipos a cada slot", async ({ page }) => {
      await page.goto("/admin/matches")
      // Should have multiple assignment selects (home/away per match)
      const assignSelects = page.locator("select[name='team_id']")
      const count = await assignSelects.count()
      // At least 2 selects per knockout round (home + away) for the first match
      expect(count).toBeGreaterThan(2)
    })

    test("el panel admin muestra la sección de resultados bonus", async ({ page }) => {
      await page.goto("/admin/matches")
      await expect(page.getByText(/resultados bonus/i)).toBeVisible()
    })
  })
})
