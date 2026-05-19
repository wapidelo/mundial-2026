/**
 * Auth setup: creates a Supabase test session via service role and saves cookies.
 * This avoids clicking email links in E2E tests.
 */
import { test as setup, expect } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

const STORAGE_STATE = path.join(__dirname, ".auth/user.json")
const ADMIN_STORAGE_STATE = path.join(__dirname, ".auth/admin.json")

async function getSessionCookies(email: string, password: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Delete user if exists and recreate
  const { data: users } = await supabase.auth.admin.listUsers()
  const existing = users?.users?.find((u) => u.email === email)
  if (existing) {
    await supabase.auth.admin.deleteUser(existing.id)
  }

  // Create test user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: email.split("@")[0] },
  })
  if (error || !data.user) throw new Error(`Cannot create test user: ${error?.message}`)

  return { userId: data.user.id }
}

setup("authenticate as regular user", async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL ?? "e2e_user@test.com"
  const password = process.env.E2E_USER_PASSWORD ?? "e2e-test-password-123"

  await getSessionCookies(email, password)

  // Sign in via the app's API
  await page.goto("/login")
  await expect(page.getByRole("heading", { name: /ingresar/i })).toBeVisible()

  // Use Supabase admin to generate magic link and navigate directly
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: linkData } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${process.env.BASE_URL ?? "http://localhost:3000"}/auth/callback` },
  })

  if (linkData?.properties?.hashed_token) {
    const callbackUrl = `${process.env.BASE_URL ?? "http://localhost:3000"}/auth/callback?token_hash=${linkData.properties.hashed_token}&type=magiclink`
    await page.goto(callbackUrl)
    await page.waitForURL("**/predictions")
  }

  await page.context().storageState({ path: STORAGE_STATE })
  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true })
})

setup("authenticate as admin", async ({ page }) => {
  const adminEmail = process.env.ADMIN_EMAIL ?? "alfredogaraban@gmail.com"
  const password = process.env.E2E_ADMIN_PASSWORD ?? "e2e-admin-password-456"

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: users } = await supabase.auth.admin.listUsers()
  const existing = users?.users?.find((u) => u.email === adminEmail)
  if (!existing) {
    await supabase.auth.admin.createUser({
      email: adminEmail,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Admin" },
    })
  }

  const { data: linkData } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: adminEmail,
    options: { redirectTo: `${process.env.BASE_URL ?? "http://localhost:3000"}/auth/callback` },
  })

  if (linkData?.properties?.hashed_token) {
    const callbackUrl = `${process.env.BASE_URL ?? "http://localhost:3000"}/auth/callback?token_hash=${linkData.properties.hashed_token}&type=magiclink`
    await page.goto(callbackUrl)
    await page.waitForURL("**/predictions")
  }

  fs.mkdirSync(path.dirname(ADMIN_STORAGE_STATE), { recursive: true })
  await page.context().storageState({ path: ADMIN_STORAGE_STATE })
})
