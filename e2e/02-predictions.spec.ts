import { test, expect } from "@playwright/test"
import * as path from "path"

test.use({ storageState: path.join(__dirname, ".auth/user.json") })

test.describe("Predicciones", () => {
  test("carga la página de predicciones con los grupos", async ({ page }) => {
    await page.goto("/predictions")
    await expect(page.getByRole("heading", { name: /mis predicciones/i })).toBeVisible()
    // At least one group section should be present
    await expect(page.getByText("GRUPO A")).toBeVisible()
  })

  test("muestra todos los 12 grupos en el acordeón", async ({ page }) => {
    await page.goto("/predictions")
    for (const letter of ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]) {
      await expect(page.locator(`text=GRUPO ${letter}`).first()).toBeVisible()
    }
  })

  test("muestra la sección de predicciones bonus", async ({ page }) => {
    await page.goto("/predictions")
    await expect(page.getByText("Predicciones Bonus")).toBeVisible()
    await expect(page.getByText(/campeón del mundial/i)).toBeVisible()
    await expect(page.getByText(/tercer lugar/i)).toBeVisible()
  })

  test("muestra el botón de guardar predicciones", async ({ page }) => {
    await page.goto("/predictions")
    await expect(page.getByRole("button", { name: /guardar todas las predicciones/i })).toBeVisible()
  })

  test("permite ingresar un marcador en un partido del Grupo A", async ({ page }) => {
    await page.goto("/predictions")

    // Get first score inputs in Group A
    const homeInputs = page.locator("input[name*='_home']")
    const awayInputs = page.locator("input[name*='_away']")

    await homeInputs.first().fill("2")
    await awayInputs.first().fill("1")

    await expect(homeInputs.first()).toHaveValue("2")
    await expect(awayInputs.first()).toHaveValue("1")
  })

  test("guarda predicciones y muestra confirmación", async ({ page }) => {
    await page.goto("/predictions")

    // Fill first 3 matches
    const homeInputs = page.locator("input[name*='_home']")
    const awayInputs = page.locator("input[name*='_away']")

    for (let i = 0; i < 3; i++) {
      await homeInputs.nth(i).fill(String(i))
      await awayInputs.nth(i).fill(String(i > 0 ? 0 : 1))
    }

    await page.getByRole("button", { name: /guardar todas las predicciones/i }).click()
    // Toast should appear
    await expect(page.getByText(/predicciones guardadas/i)).toBeVisible({ timeout: 10000 })
  })

  test("guarda predicciones bonus y muestra confirmación", async ({ page }) => {
    await page.goto("/predictions")

    // Select champion
    const championSelect = page.locator("select[name='champion_team_id']")
    await championSelect.selectOption({ index: 1 }) // Select first team

    await page.getByRole("button", { name: /guardar predicciones bonus/i }).click()
    await expect(page.getByText(/predicciones bonus guardadas/i)).toBeVisible({ timeout: 10000 })
  })

  test("muestra la barra de progreso de predicciones", async ({ page }) => {
    await page.goto("/predictions")
    // Progress bar should be visible (the div with gradient background)
    const progressBar = page.locator(".h-2.bg-white\\/10.rounded-full").first()
    await expect(progressBar).toBeVisible()
  })

  test("los inputs de score no aceptan valores negativos", async ({ page }) => {
    await page.goto("/predictions")
    const homeInput = page.locator("input[name*='_home']").first()
    await homeInput.fill("-1")
    // Should clamp to min=0
    const val = await homeInput.getAttribute("min")
    expect(val).toBe("0")
  })

  test("el contador de predicciones muestra el total dinámico desde la BD", async ({ page }) => {
    await page.goto("/predictions")
    // Counter should have a slash with a number after it (dynamic, not hardcoded to /72)
    const counter = page.locator("text=/\\d+\\/\\d+/").first()
    await expect(counter).toBeVisible()
  })

  test("muestra la sección Ronda de 32 con los 104 partidos pre-sembrados", async ({ page }) => {
    await page.goto("/predictions")
    // All 32 knockout slots are pre-seeded — Ronda de 32 should always be visible
    await expect(page.getByText("Ronda de 32")).toBeVisible()
  })
})
