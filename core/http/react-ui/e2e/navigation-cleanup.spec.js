// SPDX-License-Identifier: MIT
import { test, expect } from './coverage-fixtures.js'

const modalities = [
  ['images', 'image'], ['video', 'video'], ['threed', '3d'],
  ['tts', 'tts'], ['sound', 'sound_generation'], ['transform', 'audio_transform'],
]

test.describe('focused phone navigation', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('Home leaves creation and model lifecycle menus in their own tabs', async ({ page }) => {
    await page.route('**/v1/models', route => route.fulfill({ json: { data: [{ id: 'local-chat' }] } }))
    await page.route('**/system', route => route.fulfill({ json: { loaded_models: [{ id: 'local-chat' }] } }))
    await page.goto('/app')
    const home = page.locator('.phone-home')
    await expect(home.getByRole('link', { name: /^New chat/ })).toBeVisible()
    await expect(home.getByRole('link', { name: /^Talk/ })).toBeVisible()
    await expect(home.getByRole('button', { name: /Stop model: local-chat/ })).toBeVisible()
    await expect(home.locator('[data-testid="phone-home-create"]')).toHaveCount(0)
    await expect(home.locator('a[href*="/app/models"], a[href*="/app/import-model"]')).toHaveCount(0)
    await expect(page.locator('.home-connect')).toHaveCount(0)
    await expect(page.locator('.mobile-tabbar').getByRole('link', { name: 'Studio', exact: true })).toBeVisible()
    await expect(page.locator('.mobile-tabbar').getByRole('link', { name: 'Models', exact: true })).toBeVisible()
  })

  test('More discloses one console at a time, while search crosses closed sections', async ({ page }) => {
    await page.goto('/app/more')
    const more = page.locator('.more-page')
    const build = more.locator('details[data-console="build"]')
    const operate = more.locator('details[data-console="operate"]')
    await expect(build).not.toHaveAttribute('open', '')
    await expect(operate).not.toHaveAttribute('open', '')
    await build.locator('summary').press('Enter')
    await expect(more.getByRole('link', { name: 'Agents', exact: true })).toBeVisible()
    await operate.locator('summary').click()
    await expect(build).not.toHaveAttribute('open', '')
    await expect(more.getByRole('link', { name: 'Backends', exact: true })).toBeVisible()
    await expect(more.locator('a[href="/app/operate"]')).toHaveCount(1)
    await more.getByRole('searchbox', { name: 'Search' }).fill('settings')
    await expect(more.getByRole('link', { name: 'Settings', exact: true })).toBeVisible()
    await expect(more.locator('details')).toHaveCount(0)
    await more.getByRole('searchbox', { name: 'Search' }).fill('')
    await expect(more.getByRole('link', { name: 'Settings', exact: true })).toBeHidden()
  })
})

test.describe('Studio finds the right models', () => {
  test('regular users see availability without installation links to admin-only Models', async ({ page }) => {
    await page.route('**/api/auth/status', route => route.fulfill({ json: {
      authEnabled: true, user: { role: 'user', permissions: {} },
    } }))
    await page.route('**/api/models/capabilities', route => route.fulfill({ json: { data: [] } }))
    await page.goto('/app/studio')
    await expect(page.locator('[data-testid="studio-overview"]')).toBeVisible()
    await expect(page.locator('[data-testid="studio-modality"]').first()).toContainText('No model installed')
    await expect(page.locator('[data-testid="studio-overview"] a[href*="/app/models"]')).toHaveCount(0)
  })

  for (const [modality, tag] of modalities) {
    test(`${modality} install link sends the matching gallery filter`, async ({ page }) => {
      await page.route('**/api/models/capabilities', route => route.fulfill({ json: { data: [] } }))
      await page.goto('/app/studio')
      const request = page.waitForRequest(req => {
        const url = new URL(req.url())
        return url.pathname === '/api/models' && url.searchParams.get('tag') === tag
      })
      await page.locator(`[data-testid="studio-modality"][data-modality="${modality}"] a`).click()
      await request
      expect(new URL(page.url()).searchParams.get('usecase')).toBe(tag)
      await expect(page.locator('.models-filters__usecase-trigger')).not.toContainText('All')
      const afterReload = page.waitForRequest(req => {
        const url = new URL(req.url())
        return url.pathname === '/api/models' && url.searchParams.get('tag') === tag
      })
      await page.reload()
      await afterReload
      await expect(page.locator('.models-filters__usecase-trigger')).toBeVisible()
    })
  }

  test('legacy Studio bookmarks resolve tags and ignore unknown use cases', async ({ page }) => {
    const sound = page.waitForRequest(req => {
      const url = new URL(req.url())
      return url.pathname === '/api/models' && url.searchParams.get('tag') === 'sound_generation'
    })
    await page.goto('/app/models?capability=sound')
    await sound
    await expect(page.locator('.models-filters__usecase-trigger')).toContainText('Sound')
    const all = page.waitForRequest(req => {
      const url = new URL(req.url())
      return url.pathname === '/api/models' && !url.searchParams.has('tag')
    })
    await page.goto('/app/models?usecase=unrecognized')
    await all
    await expect(page.locator('.models-filters__usecase-trigger')).toContainText('All')
  })
})
