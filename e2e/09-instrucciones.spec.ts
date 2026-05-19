import { test, expect } from "@playwright/test"
import * as path from "path"

test.use({ storageState: path.join(__dirname, ".auth/user.json") })

test.describe("Página de Instrucciones", () => {
  test("carga correctamente con el heading principal", async ({ page }) => {
    await page.goto("/instrucciones")
    await expect(page.getByRole("heading", { name: /cómo funciona/i })).toBeVisible()
  })

  test("muestra la tabla/sección de sistema de puntos", async ({ page }) => {
    await page.goto("/instrucciones")
    await expect(page.getByText("Sistema de puntos")).toBeVisible()
    await expect(page.getByText("Marcador exacto")).toBeVisible()
    await expect(page.getByText("Ganador correcto")).toBeVisible()
    await expect(page.getByText("Empate correcto")).toBeVisible()
  })

  test("muestra la sección paso a paso", async ({ page }) => {
    await page.goto("/instrucciones")
    await expect(page.getByText("Paso a paso")).toBeVisible()
    await expect(page.getByText("Predice los partidos")).toBeVisible()
  })

  test("muestra la sección de predicciones bonus", async ({ page }) => {
    await page.goto("/instrucciones")
    await expect(page.getByText("Predicciones bonus")).toBeVisible()
    await expect(page.getByText(/campeón del mundial/i)).toBeVisible()
    await expect(page.getByText(/tercer lugar/i)).toBeVisible()
  })

  test("muestra la estructura del torneo con los 104 partidos", async ({ page }) => {
    await page.goto("/instrucciones")
    await expect(page.getByText("Estructura del torneo")).toBeVisible()
    await expect(page.getByText("104")).toBeVisible()
  })

  test("muestra las reglas importantes", async ({ page }) => {
    await page.goto("/instrucciones")
    await expect(page.getByText("Reglas importantes")).toBeVisible()
  })

  test("el enlace Info aparece en la navegación (desktop)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/instrucciones")
    await expect(page.getByRole("link", { name: /info/i }).first()).toBeVisible()
  })

  test("el enlace Info aparece en la barra inferior (mobile)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/predictions")
    await expect(page.getByRole("link", { name: /info/i })).toBeVisible()
  })

  test("puede navegar a instrucciones desde otra página", async ({ page }) => {
    await page.goto("/predictions")
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.getByRole("link", { name: /info/i }).first().click()
    await expect(page).toHaveURL(/instrucciones/)
    await expect(page.getByRole("heading", { name: /cómo funciona/i })).toBeVisible()
  })
})
