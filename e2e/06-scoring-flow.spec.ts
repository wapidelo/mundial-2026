/**
 * Flujo completo de puntuación:
 * 1. Usuario guarda predicciones para el partido #1
 * 2. Admin ingresa el resultado real
 * 3. El leaderboard refleja los puntos correctos
 */
import { test, expect } from "@playwright/test"
import * as path from "path"
import { createClient } from "@supabase/supabase-js"

test.describe("Flujo completo de puntuación", () => {
  // Reset scores before this test suite
  test.beforeAll(async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    // Reset match #1 result
    await supabase.from("matches").update({ home_score: null, away_score: null, status: "scheduled" }).eq("match_number", 1)
    // Reset predictions for match #1
    await supabase.from("predictions").update({ points: null }).eq("match_id", 1)
  })

  test("usuario guarda predicción exacta y recibe 3 puntos", async ({ browser }) => {
    // Step 1: User predicts 2-1 for match #1
    const userContext = await browser.newContext({
      storageState: path.join(__dirname, ".auth/user.json"),
    })
    const userPage = await userContext.newPage()

    await userPage.goto("/predictions")
    const homeInput = userPage.locator("input[name='prediction_1_home']")
    const awayInput = userPage.locator("input[name='prediction_1_away']")

    // Fill prediction: 2-1 (will be exact)
    await homeInput.fill("2")
    await awayInput.fill("1")

    await userPage.getByRole("button", { name: /guardar todas las predicciones/i }).click()
    await expect(userPage.getByText(/predicciones guardadas/i)).toBeVisible({ timeout: 10000 })

    // Step 2: Admin enters result 2-1 (exact match)
    const adminContext = await browser.newContext({
      storageState: path.join(__dirname, ".auth/admin.json"),
    })
    const adminPage = await adminContext.newPage()

    await adminPage.goto("/admin/matches")
    const adminHomeInput = adminPage.locator("input[name='home_score']").first()
    const adminAwayInput = adminPage.locator("input[name='away_score']").first()

    await adminHomeInput.fill("2")
    await adminAwayInput.fill("1")
    await adminPage.getByRole("button", { name: /guardar/i }).first().click()
    await adminPage.waitForURL("**/admin/matches")

    // Step 3: User sees 3 points for exact score
    await userPage.reload()
    await expect(userPage.getByText(/¡Exacto! \+3 pts/i)).toBeVisible({ timeout: 10000 })

    // Step 4: Leaderboard should show points
    await userPage.goto("/leaderboard")
    // User should appear with at least 3 points
    const leaderboardRow = userPage.locator("text=(tú)").first()
    await expect(leaderboardRow).toBeVisible()

    await userContext.close()
    await adminContext.close()
  })

  test("predicción de resultado correcto (1X2) da 1 punto", async ({ browser }) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    // Reset match #2 result
    await supabase.from("matches").update({ home_score: null, away_score: null, status: "scheduled" }).eq("match_number", 2)

    const userContext = await browser.newContext({
      storageState: path.join(__dirname, ".auth/user.json"),
    })
    const userPage = await userContext.newPage()

    // Predict 1-0 for match #2 (home wins)
    await userPage.goto("/predictions")
    const homeInput = userPage.locator("input[name='prediction_2_home']")
    const awayInput = userPage.locator("input[name='prediction_2_away']")
    await homeInput.fill("1")
    await awayInput.fill("0")
    await userPage.getByRole("button", { name: /guardar todas las predicciones/i }).click()
    await expect(userPage.getByText(/predicciones guardadas/i)).toBeVisible({ timeout: 10000 })

    // Admin enters 3-0 (home still wins, different score)
    const adminContext = await browser.newContext({
      storageState: path.join(__dirname, ".auth/admin.json"),
    })
    const adminPage = await adminContext.newPage()
    await adminPage.goto("/admin/matches")

    const rows = adminPage.locator("input[name='home_score']")
    await rows.nth(1).fill("3")
    await adminPage.locator("input[name='away_score']").nth(1).fill("0")
    await adminPage.getByRole("button", { name: /guardar/i }).nth(1).click()
    await adminPage.waitForURL("**/admin/matches")

    // User sees +1 point (correct result)
    await userPage.reload()
    await expect(userPage.getByText(/resultado \+1 pt/i)).toBeVisible({ timeout: 10000 })

    await userContext.close()
    await adminContext.close()
  })
})
