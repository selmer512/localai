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
    // Light cells are white on a pale ground, not the dark theme's navy.
    // Polled: the page background eases between themes.
    await expect.poll(() => page.locator('.more-page section > div').first().evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)')
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(247, 249, 252)')
  })
})

test.describe('phone pages read and flow like an app', () => {
  test.use(phone)

  // Tab labels (11px, iOS uses 10) and badges (12px) are the only text
  // allowed under the 13px iOS caption size.
  for (const path of ['/app', '/app/models', '/app/backends', '/app/operate', '/app/nodes', '/app/talk', '/app/fine-tune', '/app/image', '/app/activity', '/app/more']) {
    test(`no body text under 13px on ${path}`, async ({ page }) => {
      await page.goto(path)
      await page.waitForTimeout(800)
      const small = await page.evaluate(() => {
        const out = []
        const walker = document.createTreeWalker(document.querySelector('.main-content-inner'), NodeFilter.SHOW_TEXT)
        let n
        while ((n = walker.nextNode())) {
          const el = n.parentElement
          if (!n.textContent.trim() || !el || !el.offsetParent) continue
          if (el.closest('.badge, .sr-only, .tw\\:sr-only, code, pre, kbd, [aria-hidden="true"], .toast-container')) continue
          const r = el.getBoundingClientRect()
          if (r.width < 2 || r.height < 2) continue
          const fs = parseFloat(getComputedStyle(el).fontSize)
          if (fs < 13) out.push(`${el.className || el.tagName} ${fs}px "${n.textContent.trim().slice(0, 20)}"`)
        }
        return out
      })
      expect(small).toEqual([])
    })
  }

  test('page actions sit in one row with the primary action first', async ({ page }) => {
    await page.goto('/app/fine-tune')
    await expect(page.locator('.page-header__meta .btn').first()).toBeVisible()
    const tops = await page.locator('.page-header__meta .btn').evaluateAll(els => [...new Set(els.map(el => Math.round(el.getBoundingClientRect().top)))])
    expect(tops).toHaveLength(1)
  })

  test('an empty state does not repeat the header\'s secondary actions', async ({ page }) => {
    await page.goto('/app/fine-tune')
    const empty = page.locator('.empty-state')
    await expect(empty).toBeVisible()
    await expect(empty.locator('.btn-secondary:visible')).toHaveCount(0)
    await expect(empty).toHaveCSS('text-align', 'center')
  })

  test('Talk options are switches and Connect stays docked above the tab bar', async ({ page }) => {
    await page.goto('/app/talk')
    const sw = page.getByRole('checkbox', { name: /Interrupt while it speaks/ })
    await expect(sw).toHaveCSS('width', '51px')
    await expect(sw).toHaveCSS('appearance', 'none')
    await expect(page.locator('.talk-col .hstack--between')).toHaveCSS('position', 'sticky')
  })

  test('chat bubbles carry the speaker, so there is no "You" label', async ({ page }) => {
    await page.goto('/app/chat')
    await page.evaluate(() => {
      const user = document.createElement('div')
      user.className = 'chat-message chat-message-user'
      user.innerHTML = '<div class="chat-message-bubble"><span class="chat-message-model">You</span><div class="chat-message-content">Hi</div></div>'
      document.body.appendChild(user)
    })
    await expect(page.locator('.chat-message-user .chat-message-model')).toBeHidden()
  })
})

test.describe('the empty conversation on a phone', () => {
  test.use(phone)

  test('recent chats are one grouped list and the title is plain text', async ({ page }) => {
    await page.addInitScript(() => {
      const now = Date.now()
      const mk = (id, name, history) => ({ id, name, model: 'alpha-7b', history, createdAt: now, updatedAt: now })
      localStorage.setItem('localai_chats_data', JSON.stringify({ activeChatId: 'a', chats: [
        mk('a', 'New Chat', []),
        mk('b', 'Earlier', [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }]),
        mk('c', 'Older', [{ role: 'user', content: 'Yo' }, { role: 'assistant', content: 'Hey' }]),
      ] }))
    })
    await page.route('**/api/models/capabilities', route => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: [{ id: 'alpha-7b', capabilities: ['FLAG_CHAT'] }] }),
    }))
    await page.goto('/app/chat')
    const items = page.locator('.chat-recent-strip-item')
    await expect(items).toHaveCount(2)
    // Rows touch, split by a hairline, instead of floating bordered cards.
    const [a, b] = await items.evaluateAll(els => els.map(el => el.getBoundingClientRect()))
    expect(Math.round(b.top)).toBe(Math.round(a.bottom))
    await expect(items.first()).toHaveCSS('border-top-width', '0px')
    // The composer's paperclip already offers attachments.
    await expect(page.locator('.chat-empty-hints')).toBeHidden()
    // A focus ring on the title button rendered as a soft halo in Safari.
    const title = page.locator('.chat-header-model > button.input')
    await title.focus()
    await expect(title).toHaveCSS('box-shadow', 'none')
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
