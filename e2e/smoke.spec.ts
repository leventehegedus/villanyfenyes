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
  await expect(sheet.getByText('Pálya')).toHaveCount(0)
  await expect(page).toHaveURL(/\/menetrend\?s=55&l=L1/)
})

test('team page and language toggle', async ({ page }) => {
  await page.goto('/t/69?s=55&l=L1')
  await expect(page.getByRole('heading', { name: 'Lokomotív MFC' })).toBeVisible()
  await page.getByRole('button', { name: /^EN/ }).click()
  await expect(page.getByText('Computed from results').first()).toBeVisible()
})

test('schedule filters are reflected in the URL', async ({ page }) => {
  await page.goto('/menetrend?s=55&l=L1')
  await expect(page.getByRole('radio', { name: 'Hátralévő' })).toHaveAttribute('data-state', 'on')
  await page.getByRole('radio', { name: 'Lejátszott' }).click()
  await expect(page).toHaveURL(/st=past/)
  await expect(page.getByText('2:3')).toBeVisible()
})

test('stats: progression chart, cross table and form hover', async ({ page }) => {
  await page.goto('/statisztika?s=55&l=L1')
  await expect(page.getByRole('button', { name: 'Lokomotív MFC', pressed: true })).toBeVisible()
  await page.getByRole('button', { name: 'Kiemelés törlése' }).click()
  await expect(page).toHaveURL(/h=-/)
  await expect(page.getByRole('button', { name: 'Lokomotív MFC', pressed: true })).toHaveCount(0)
  await page.getByRole('tab', { name: 'Kereszttábla' }).click()
  await expect(page).toHaveURL(/v=cross/)
  await expect(page.getByRole('link', { name: /Gyermekláncfűrész 2:3 Lokomotív MFC/ }).first()).toBeVisible()
  await page.goto('/t/69?s=55&l=L1')
  await page.getByRole('link', { name: /Győzelem: Gyermekláncfűrész 2:3 Lokomotív MFC/ }).first().hover()
  await expect(page.getByRole('tooltip')).toHaveText('Gyermekláncfűrész 2:3 Lokomotív MFC')
})

test('scorers can be filtered by team', async ({ page }) => {
  await page.goto('/golok?s=55&l=L1&t=100,999')
  await expect(page.getByRole('cell', { name: 'Horváth Dávid' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Pap Bulcsú' })).toHaveCount(0)
})

test('standings show the form column and the schedule team filter is multi-select', async ({ page }) => {
  await page.goto('/?s=55&l=L1')
  await expect(page.getByRole('columnheader', { name: 'Forma' })).toBeVisible()
  await page.goto('/menetrend?s=55&l=L1')
  await page.getByRole('button', { name: /Csapat: Minden csapat/ }).click()
  await page.getByRole('menuitemcheckbox', { name: 'Borg' }).click()
  await page.getByRole('menuitemcheckbox', { name: 'Banditák' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /Csapat: 2 csapat/ })).toBeVisible()
  await expect(page).toHaveURL(/t=[^&]+%2C|t=[^&]+,/)
})

test('odds tab shows a position heatmap with certain bounds', async ({ page }) => {
  await page.goto('/statisztika?s=55&l=L1&v=odds')
  await expect(page.getByRole('heading', { name: 'Helyezési esélyek' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Elérhető' })).toBeVisible()
  await expect(page.getByRole('rowheader', { name: 'Lokomotív MFC' })).toBeVisible()
})

test('clicking a team on the scorer list filters by it', async ({ page }) => {
  await page.goto('/golok?s=55&l=L1')
  await page.getByRole('button', { name: 'Szűrés erre a csapatra: Gyermekláncfűrész' }).first().click()
  await expect(page).toHaveURL(/t=100/)
  await expect(page.getByRole('cell', { name: 'Pap Bulcsú' })).toHaveCount(0)
})

test('what-if: entering a result re-ranks the table and is kept in the URL', async ({ page }) => {
  await page.goto('/statisztika?s=55&l=L1&v=whatif')
  await expect(page.getByRole('heading', { name: 'Mi lenne, ha…' })).toBeVisible()
  await page.getByRole('button', { name: '2' }).first().click()
  await expect(page).toHaveURL(/w=[^&]+%3A0-1|w=[^&]+:0-1/)
  await expect(page.getByText('1 meccshez adtál meg eredményt')).toBeVisible()
  await page.getByRole('button', { name: 'Visszaállítás' }).click()
  await expect(page.getByText('0 meccshez adtál meg eredményt')).toBeVisible()
})

test('player page from the scorer list', async ({ page }) => {
  await page.goto('/golok?s=55&l=L1')
  await page.getByRole('link', { name: 'Pap Bulcsú' }).click()
  await expect(page.getByRole('heading', { name: 'Pap Bulcsú' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Gyermekláncfűrész 2:3 Lokomotív MFC' })).toBeVisible()
})

test('team all-time page: totals, timeline and picker limited to the team', async ({ page }) => {
  await page.goto('/t/69?s=55&l=L1')
  await page.getByRole('link', { name: 'Összesítés' }).click()
  await expect(page).toHaveURL(/\/t\/69\/osszes/)
  await expect(page.getByRole('heading', { name: 'Lokomotív MFC' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mérleg ligánként' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Összesen' })).toBeVisible()
  await expect(page.getByText('folyamatban').first()).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Szezon' })).toHaveCount(0)
})

test('team page: table under the charts, past week from the URL', async ({ page }) => {
  // The fixture team has one played match, so no chart to click; the chart sets the same ?w= param.
  await page.goto('/t/69?s=55&l=L1')
  await expect(page.getByRole('heading', { name: 'Tabella', exact: true })).toBeVisible()
  await expect(page.locator('tr[aria-current="true"]')).toContainText('Lokomotív MFC')
  await page.goto('/t/69?s=55&l=L1&w=2026-08-31')
  await expect(page.getByRole('heading', { name: /kezdetű hét végén/ })).toBeVisible()
  await page.getByRole('button', { name: 'Aktuális' }).click()
  await expect(page).not.toHaveURL(/w=/)
})

test('stats: clicking the progression chart shows the table at that week', async ({ page }) => {
  await page.goto('/statisztika?s=55&l=L1')
  await expect(page.getByRole('heading', { name: 'Tabella', exact: true })).toBeVisible()
  const chart = page.locator('.recharts-surface').first()
  await chart.scrollIntoViewIfNeeded()
  const box = await chart.boundingBox()
  if (!box) throw new Error('chart not rendered')
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2)
  await page.mouse.click(box.x + box.width * 0.4, box.y + box.height / 2)
  await expect(page).toHaveURL(/w=\d{4}-\d{2}-\d{2}/)
  await expect(page.getByRole('heading', { name: /kezdetű hét végén/ })).toBeVisible()
  await page.getByRole('button', { name: 'Aktuális' }).click()
  await expect(page).not.toHaveURL(/w=/)
})
