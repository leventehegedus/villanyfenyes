import { expect, test } from '@playwright/test'

// Fail any test that logs a console error or throws in the page.
test.afterEach(async ({ page }, info) => {
  expect(info.annotations.filter((a) => a.type === 'console-error'), 'console errors').toEqual([])
  void page
})

test.beforeEach(async ({ page }, info) => {
  page.on('console', (m) => m.type() === 'error' && info.annotations.push({ type: 'console-error', description: m.text() }))
  page.on('pageerror', (e) => info.annotations.push({ type: 'console-error', description: e.message }))
})


test('standings load from static data with disclaimer and data age', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Tabella' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Lokomotív MFC' }).first()).toBeVisible()
  await expect(page.getByText(/Nem hivatalos nézegető/)).toBeVisible()
  await expect(page.getByText(/Adatok frissítve/)).toBeVisible()
  await expect(page.getByText('Kieső').first()).toBeVisible()
})

test('match deep link opens the detail sheet with score and scorers', async ({ page }) => {
  await page.goto('/m/48343?s=55&l=L1')
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByText('2:3')).toBeVisible()
  await expect(sheet.getByText('Pap Bulcsú')).toBeVisible()
  await sheet.getByRole('button', { name: 'Bezár' }).click()
  await expect(page).toHaveURL(/\/eredmenyek\?s=55&l=L1/)
})

test('team page, favourites and language toggle', async ({ page }) => {
  await page.goto('/t/69?s=55&l=L1')
  await expect(page.getByRole('heading', { name: 'Lokomotív MFC' })).toBeVisible()
  await page.getByRole('button', { name: /Lokomotív MFC hozzáadása/ }).click()
  await expect(page.getByRole('button', { name: /Lokomotív MFC eltávolítása/ })).toBeVisible()
  await page.getByRole('button', { name: /^EN/ }).click()
  await expect(page.getByText('Computed from results').first()).toBeVisible()
})

test('schedule filters are reflected in the URL', async ({ page }) => {
  await page.goto('/menetrend?s=55&l=L1')
  await page.getByRole('radio', { name: 'Lejátszott' }).click()
  await expect(page).toHaveURL(/st=played/)
  await expect(page.getByText('2:3')).toBeVisible()
})
