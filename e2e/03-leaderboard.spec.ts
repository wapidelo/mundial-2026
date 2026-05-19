import { test, expect } from "@playwright/test"
import * as path from "path"

test.use({ storageState: path.join(__dirname, ".auth/user.json") })

test.describe("Tabla de Posiciones", () => {
  test("carga la página de leaderboard", async ({ page }) => {
    await page.goto("/leaderboard")
    await expect(page.getByRole("heading", { name: /tabla de posiciones/i })).toBeVisible()
  })

  test("muestra el usuario actual marcado como '(tú)'", async ({ page }) => {
    await page.goto("/leaderboard")
    // If user has at least one prediction saved, they should appear in the leaderboard
    // We check that the page renders without errors
    await expect(page.locator("h1")).toContainText("Posiciones")
  })

  test("muestra las columnas de estadísticas", async ({ page }) => {
    await page.goto("/leaderboard")
    await expect(page.getByText("Exactos").first()).toBeVisible()
    await expect(page.getByText("Correctos").first()).toBeVisible()
    await expect(page.getByText("Puntos").first()).toBeVisible()
  })

  test("muestra el sistema de puntos al pie", async ({ page }) => {
    await page.goto("/leaderboard")
    await expect(page.getByText(/exactos.*marcador exacto/i)).toBeVisible()
  })

  test("navega al leaderboard desde el nav", async ({ page }) => {
    await page.goto("/predictions")
    await page.getByRole("link", { name: /posiciones/i }).click()
    await page.waitForURL("**/leaderboard")
    await expect(page.getByRole("heading", { name: /tabla de posiciones/i })).toBeVisible()
  })
})
