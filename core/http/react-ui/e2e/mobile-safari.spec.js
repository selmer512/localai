import { test, expect } from '@playwright/test'

// iPhone-sized viewport: no page may scroll sideways, and form controls must
// be >=16px so Safari does not zoom on focus.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

for (const path of ['/app', '/app/chat', '/app/settings', '/app/models']) {
  test(`no horizontal overflow on ${path}`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
}

test('viewport covers the safe area and inputs avoid iOS zoom', async ({ page }) => {
  await page.goto('/app')
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/)
  await page.waitForLoadState('networkidle')
  const size = await page.evaluate(() => {
    const el = document.createElement('input')
    el.className = 'input'
    document.body.appendChild(el)
    return parseFloat(getComputedStyle(el).fontSize)
  })
  expect(size).toBeGreaterThanOrEqual(16)
})
