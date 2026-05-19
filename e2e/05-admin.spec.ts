import { test, expect } from "@playwright/test"
import * as path from "path"

test.describe("Panel Admin", () => {
  test.describe("como usuario regular", () => {
    test.use({ storageState: path.join(__dirname, ".auth/user.json") })

    test("redirige al usuario sin permisos admin a la raíz", async ({ page }) => {
      await page.goto("/admin/matches")
      // Non-admin should be redirected away
      await expect(page).not.toHaveURL(/admin/)
    })
  })

  test.describe("como admin", () => {
    test.use({ storageState: path.join(__dirname, ".auth/admin.json") })

    test("carga el panel de admin correctamente", async ({ page }) => {
      await page.goto("/admin/matches")
      await expect(page.getByRole("heading", { name: /administrar resultados/i })).toBeVisible()
    })

    test("muestra el enlace de Admin en el nav para el admin", async ({ page }) => {
      await page.goto("/predictions")
      await expect(page.getByRole("link", { name: /admin/i })).toBeVisible()
    })

    test("muestra la sección de resultados bonus", async ({ page }) => {
      await page.goto("/admin/matches")
      await expect(page.getByText(/resultados bonus/i)).toBeVisible()
      await expect(page.getByText(/campeón/i)).toBeVisible()
      await expect(page.getByText(/tercer lugar/i)).toBeVisible()
    })

    test("muestra todos los partidos agrupados por grupo", async ({ page }) => {
      await page.goto("/admin/matches")
      // Should show GRUPO labels
      await expect(page.locator("text=GRUPO A").first()).toBeVisible()
    })

    test("el admin puede ingresar el resultado de un partido", async ({ page }) => {
      await page.goto("/admin/matches")

      // Find the first home score input (for match #1)
      const homeInputs = page.locator("input[name='home_score']")
      const awayInputs = page.locator("input[name='away_score']")
      const submitButtons = page.getByRole("button", { name: /guardar/i })

      await homeInputs.first().fill("2")
      await awayInputs.first().fill("1")
      await submitButtons.first().click()

      // Should reload and show updated score
      await page.waitForURL("**/admin/matches")
      // The match should now show 2-1 or "Actualizar"
      await expect(page.getByText("Actualizar").first()).toBeVisible({ timeout: 10000 })
    })

    test("el admin puede ingresar el campeón del torneo", async ({ page }) => {
      await page.goto("/admin/matches")

      const championSelect = page.locator("select[name='team_id']").first()
      await championSelect.selectOption({ index: 1 })

      const submitButtons = page.getByRole("button", { name: /guardar/i })
      await submitButtons.first().click()

      // Page should reload without errors
      await page.waitForURL("**/admin/matches")
      await expect(page.getByRole("heading", { name: /administrar resultados/i })).toBeVisible()
    })
  })
})
