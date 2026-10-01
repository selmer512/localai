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

test('tab bar navigates, opens the drawer via More, and hides on chat', async ({ page }) => {
  await page.goto('/app')
  const bar = page.getByRole('navigation', { name: 'Mobile navigation' })
  await expect(bar).toBeVisible()
  await bar.getByRole('link', { name: 'Studio' }).click()
  await expect(page).toHaveURL(/\/app\/studio/)
  await bar.getByRole('button', { name: 'More' }).click()
  await expect(page.locator('.sidebar.open')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await bar.getByRole('link', { name: 'Chat' }).click()
  await expect(page).toHaveURL(/\/app\/chat/)
  await expect(page.locator('.mobile-tabbar')).toHaveCount(0)
})

test('tab bar is phone-only', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  await page.goto('/app')
  await expect(page.locator('.mobile-tabbar')).toBeHidden()
  await ctx.close()
})

test('model picker opens as a bottom sheet and selects', async ({ page }) => {
  await page.route('**/api/models/capabilities', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ data: ['alpha-7b', 'beta-3b', 'gamma-vision'].map(id => ({ id, capabilities: ['FLAG_CHAT'] })) }),
  }))
  await page.goto('/app/chat')
  const trigger = page.locator('.main-content button.input[aria-haspopup="listbox"]').first()
  await trigger.click()
  const panel = page.locator('.searchable-select__panel')
  await expect(panel).toBeVisible()
  const vp = page.viewportSize()
  // The sheet slides in; poll until it has settled against the bottom edge.
  await expect.poll(async () => {
    const box = await panel.boundingBox()
    return [Math.round(box.x), Math.round(box.width), Math.round(box.y + box.height)]
  }).toEqual([0, vp.width, vp.height])
  const opt = panel.getByRole('option', { name: 'beta-3b' })
  expect((await opt.boundingBox()).height).toBeGreaterThanOrEqual(48)
  // Tapping the dimmed area dismisses without selecting.
  await page.locator('.searchable-select__backdrop').click({ position: { x: 10, y: 10 } })
  await expect(panel).toHaveCount(0)
  await trigger.click()
  await panel.getByRole('option', { name: 'beta-3b' }).click()
  await expect(panel).toHaveCount(0)
  await expect(trigger).toContainText('beta-3b')
})
