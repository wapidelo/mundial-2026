import { test, expect } from "@playwright/test"
import * as path from "path"

test.use({ storageState: path.join(__dirname, ".auth/user.json") })

test.describe("Partidos", () => {
  test("carga la página de partidos", async ({ page }) => {
    await page.goto("/matches")
    await expect(page.getByRole("heading", { name: /partidos/i })).toBeVisible()
  })

  test("muestra el contador de partidos finalizados", async ({ page }) => {
    await page.goto("/matches")
    await expect(page.getByText(/finalizados/i)).toBeVisible()
  })

  test("muestra grupos con partidos por jugar inicialmente", async ({ page }) => {
    await page.goto("/matches")
    // At least the first group section should be visible
    await expect(page.locator("text=GRUPO").first()).toBeVisible()
  })

  test("muestra el estado 'Por jugar' en partidos sin resultado", async ({ page }) => {
    await page.goto("/matches")
    // Initially all matches should be 'Por jugar' if no admin has entered results
    const status = page.getByText("Por jugar").first()
    await expect(status).toBeVisible()
  })

  test("muestra banderas de equipos en los partidos", async ({ page }) => {
    await page.goto("/matches")
    // Team flags should be visible as emojis
    // We check that team names are shown
    await expect(page.getByText("México")).toBeVisible()
  })

  test("navega a partidos desde el nav", async ({ page }) => {
    await page.goto("/predictions")
    await page.getByRole("link", { name: /partidos/i }).click()
    await page.waitForURL("**/matches")
    await expect(page.getByRole("heading", { name: /partidos/i })).toBeVisible()
  })
})
