import { test, expect } from "@playwright/test"
import * as path from "path"

test.use({ storageState: path.join(__dirname, ".auth/user.json") })

test.describe("Navegación y UI general", () => {
  test("la landing page muestra el contador y estadísticas", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Quiniela")).toBeVisible()
    await expect(page.getByText("Mundial")).toBeVisible()
    await expect(page.getByText("2026")).toBeVisible()
    // Stats section
    await expect(page.getByText("Participantes")).toBeVisible()
    await expect(page.getByText("Predicciones")).toBeVisible()
    await expect(page.getByText("Partidos")).toBeVisible()
  })

  test("la landing muestra el sistema de puntos", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Sistema de puntos")).toBeVisible()
    await expect(page.getByText("+3 pts")).toBeVisible()
    await expect(page.getByText("+5 pts")).toBeVisible()
  })

  test("el nav tiene todos los enlaces esperados", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("link", { name: /predicciones/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /posiciones/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /partidos/i })).toBeVisible()
  })

  test("el botón de salir en el nav cierra la sesión", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /salir/i }).click()
    await page.waitForURL("**/login")
    await expect(page.getByRole("heading", { name: /ingresar/i })).toBeVisible()
  })

  test("los grupos del acordeón en predicciones se pueden colapsar", async ({ page }) => {
    await page.goto("/predictions")
    // Click on the first group summary to collapse it
    const firstSummary = page.locator("details summary").first()
    await firstSummary.click()
    // After clicking, the content should be hidden (details closed)
    const firstDetails = page.locator("details").first()
    await expect(firstDetails).not.toHaveAttribute("open")
  })

  test("las páginas tienen diseño oscuro con colores del Mundial", async ({ page }) => {
    await page.goto("/")
    const body = page.locator("body")
    const bgColor = await body.evaluate((el) => getComputedStyle(el).backgroundColor)
    // Should be dark (not white)
    expect(bgColor).not.toBe("rgb(255, 255, 255)")
  })

  test("responsive: el nav es visible en móvil", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/predictions")
    // Nav should still be visible on mobile
    await expect(page.locator("nav")).toBeVisible()
  })
})
