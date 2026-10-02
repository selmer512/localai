import { test, expect } from './coverage-fixtures.js'

test.describe('Operate console on a narrow screen', () => {
  // Phones get the console's pages as one swipeable strip of pills: nothing to
  // expand first, and it costs a single line above the page.
  test('ignores the desktop collapsed preference', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.addInitScript(() => localStorage.setItem('localai_console_rail_collapsed', 'true'))
    await page.goto('/app/operate')

    const rail = page.locator('.console-rail')
    await expect(rail).toHaveCSS('width', '390px')
    // Labels stay visible: the icon-only desktop rail does not leak through.
    await expect(rail.locator('a.nav-item', { hasText: 'Overview' }).locator('.nav-label')).toBeVisible()
    await expect(rail.locator('.console-rail-collapse')).toBeHidden()
  })

  test('the navigation leaves the overview on screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto('/app/operate')

    await expect(page.locator('.console-rail-groups')).toBeVisible()
    const heading = page.getByRole('heading', { name: 'Overview', exact: true })
    const box = await heading.boundingBox()
    expect(box).not.toBeNull()
    expect(box.y).toBeLessThan(800)
  })

  test('the navigation is one line that scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto('/app/operate')

    const groups = page.locator('.console-rail-groups')
    await expect(groups).toBeVisible()
    const { height, scrolls } = await groups.evaluate(el => ({
      height: el.getBoundingClientRect().height,
      scrolls: el.scrollWidth > el.clientWidth && getComputedStyle(el).overflowX === 'auto',
    }))
    expect(height).toBeLessThan(80)
    expect(scrolls).toBe(true)
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
