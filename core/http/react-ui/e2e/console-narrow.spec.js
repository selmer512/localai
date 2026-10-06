import { test, expect } from './coverage-fixtures.js'

test.describe('Operate console on a phone', () => {
  // Phones reach console pages from the More tab and return with Back, as in
  // an iOS app; the section strip would only repeat More above the title.
  test('hides the section strip and opens on the large title', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.addInitScript(() => localStorage.setItem('localai_console_rail_collapsed', 'true'))
    await page.goto('/app/operate')
    await expect(page.locator('.console-rail')).toBeHidden()
    const heading = page.getByRole('heading', { name: 'Overview', exact: true })
    await expect(heading).toBeVisible()
    expect((await heading.boundingBox()).y).toBeLessThan(160)
    await expect(page.locator('.ios-navbar__back')).toContainText('More')
  })

  test('More lists every Operate page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto('/app/more')
    for (const name of ['Overview', 'Backends', 'Activity', 'Usage', 'Traces', 'Settings']) {
      await expect(page.locator('.more-page').getByRole('link', { name, exact: true })).toBeVisible()
    }
  })

  test('tablets keep the console rail', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1000 })
    await page.goto('/app/operate')
    await expect(page.locator('.console-rail')).toBeVisible()
    await expect(page.locator('.ios-navbar')).toHaveCount(0)
  })
})

test.describe('Operate headline figures', () => {
  for (const width of [390, 768, 1024]) {
    test(`labels remain legible at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/app/operate')

      const labels = page.locator('.operate-headline dt')
      await expect(labels.first()).toBeVisible()
      const clipped = await labels.evaluateAll(els =>
        els.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent))
      expect(clipped).toEqual([])
    })
  }

  test('values remain legible in dark theme', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 950 })
    await page.goto('/app/operate')

    const invisible = await page.locator('.operate-headline__value').evaluateAll(els => els
      .map(el => ({ text: el.textContent, color: getComputedStyle(el).color }))
      .filter(value => value.color === 'rgb(0, 0, 0)'))
    expect(invisible).toEqual([])
  })
})
