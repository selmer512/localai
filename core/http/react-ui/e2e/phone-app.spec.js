import { test, expect } from './coverage-fixtures.js'

// The phone app shell (<640px): iOS navigation bar with large titles, a tab
// bar whose More tab lists every other destination, and pages pushed from a
// tab that return with Back. Desktop and tablet keep the sidebar layout.

const phone = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }

test.describe('phone app shell', () => {
  test.use(phone)

  test('Back names the screen it returns to', async ({ page }) => {
    await page.goto('/app')
    await page.locator('.phone-home').getByRole('link', { name: /^Talk/ }).click()
    await expect(page).toHaveURL(/\/app\/talk/)
    // The previous screen's large title, not a generic "Back".
    await expect(page.locator('.ios-navbar__back')).toHaveText('LocalAI')
    await page.locator('.ios-navbar__back').click()
    await expect(page).toHaveURL(/\/app$/)
  })

  test('a screen opened directly falls back to its tab', async ({ page }) => {
    await page.goto('/app/settings')
    await expect(page.locator('.ios-navbar__back')).toHaveText('More')
    await page.locator('.ios-navbar__back').click()
    await expect(page).toHaveURL(/\/app\/more$/)
  })

  test('tab roots have no back button', async ({ page }) => {
    for (const path of ['/app', '/app/studio', '/app/models', '/app/more']) {
      await page.goto(path)
      await expect(page.locator('.ios-navbar')).toBeVisible()
      await expect(page.locator('.ios-navbar__back')).toHaveCount(0)
    }
  })

  test('More holds the preferences: dark mode switch and language', async ({ page }) => {
    await page.goto('/app/more')
    const dark = page.getByRole('switch', { name: 'Dark mode' })
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    await expect(dark).toHaveAttribute('aria-checked', before === 'dark' ? 'true' : 'false')
    await dark.click()
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-theme'))).not.toBe(before)
    await expect(page.locator('.more-page').getByLabel('Change language')).toHaveValue('en')
  })

  test('the chat model picker opens as a sheet on the bottom edge', async ({ page }) => {
    await page.route('**/api/models/capabilities', route => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: ['alpha-7b', 'beta-3b'].map(id => ({ id, capabilities: ['FLAG_CHAT'] })) }),
    }))
    await page.goto('/app/chat')
    // The header is the conversation bar: back, model as title, actions.
    await expect(page.locator('.chat-header-back')).toBeVisible()
    await page.locator('.chat-header-model > button.input').click()
    const panel = page.locator('.searchable-select__panel')
    await expect(panel).toBeVisible()
    // A blurred header once made itself the sheet's containing block and the
    // sheet opened above the screen.
    await expect.poll(async () => {
      const box = await panel.boundingBox()
      return [Math.round(box.y + box.height), box.y >= 0]
    }).toEqual([844, true])
  })

  test('the light theme carries through the shell', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('localai-theme', 'light'))
    await page.goto('/app/more')
    const [cell, ground] = await Promise.all([
      page.locator('.more-page section > div').first().evaluate(el => getComputedStyle(el).backgroundColor),
      page.evaluate(() => getComputedStyle(document.body).backgroundColor),
    ])
    // Light cells are white on a pale ground, not the dark theme's navy.
    expect(cell).toBe('rgb(255, 255, 255)')
    expect(ground).not.toBe('rgb(13, 17, 23)')
  })
})

test.describe('desktop is unchanged', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('keeps the sidebar, the web header and the desktop home', async ({ page }) => {
    await page.goto('/app')
    await expect(page.locator('.sidebar')).toBeVisible()
    await expect(page.locator('.ios-navbar')).toHaveCount(0)
    await expect(page.locator('.mobile-tabbar')).toBeHidden()
    await expect(page.locator('.phone-home')).toHaveCount(0)
    await expect(page.locator('.home-greeting')).toBeVisible()
  })
})
