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
    // The conversation title sits above the compact model picker.
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

  test('the picker traps focus, dismisses and returns to its trigger', async ({ page }) => {
    await page.route('**/api/models/capabilities', route => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: ['alpha-7b', 'beta-3b'].map(id => ({ id, capabilities: ['FLAG_CHAT'] })) }),
    }))
    await page.goto('/app/chat')
    const trigger = page.locator('.chat-header-model > button.input')
    await trigger.click()
    const sheet = page.getByRole('dialog', { name: 'Select model...' })
    const cancel = sheet.getByRole('button', { name: 'Cancel' })
    await expect(cancel).toBeFocused()
    await expect(page.locator('body')).toHaveAttribute('data-scroll-locked', '1')
    await page.keyboard.press('Shift+Tab')
    await expect(sheet.getByRole('option', { name: 'beta-3b' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(cancel).toBeFocused()
    await sheet.getByRole('searchbox').fill('beta')
    await sheet.getByRole('searchbox').press('Enter')
    await expect(sheet).toHaveCount(0)
    await expect(trigger).toContainText('beta-3b')
    await expect(trigger).toBeFocused()
    await trigger.click()
    await sheet.getByRole('button', { name: 'Cancel' }).click()
    await expect(trigger).toContainText('beta-3b')
    await expect(trigger).toBeFocused()
    await expect(page.locator('body')).not.toHaveAttribute('data-scroll-locked', '1')
  })

  test('More search finds pages, recovers from no results and keeps preferences in reach', async ({ page }) => {
    await page.goto('/app/more')
    const more = page.locator('.more-page')
    const search = more.getByRole('searchbox', { name: 'Search' })
    const dark = more.getByRole('switch', { name: 'Dark mode' })
    expect((await dark.boundingBox()).y).toBeLessThan(600)
    await search.fill('settings')
    await expect(more.getByRole('link', { name: 'Settings', exact: true })).toBeVisible()
    await expect(more.getByRole('link', { name: 'Agents', exact: true })).toHaveCount(0)
    await search.fill('no such page')
    await expect(more.getByRole('status')).toHaveText('No results. Try another search.')
    await search.fill('')
    await expect(more.getByRole('link', { name: 'Agents', exact: true })).toBeHidden()
    await more.locator('details[data-console="build"] > summary').click()
    await expect(more.getByRole('link', { name: 'Agents', exact: true })).toBeVisible()
    await expect(dark).toBeVisible()
  })

  test('More search also finds settings and whole sections', async ({ page }) => {
    await page.goto('/app/more')
    const more = page.locator('.more-page')
    const search = more.getByRole('searchbox', { name: 'Search' })
    await search.fill('dark')
    await expect(more.getByRole('switch', { name: 'Dark mode' })).toBeVisible()
    await expect(more.getByLabel('Change language')).toHaveCount(0)
    await search.fill('language')
    await expect(more.getByLabel('Change language')).toBeVisible()
    await search.fill('github')
    await expect(more.getByRole('link', { name: /GitHub/ })).toBeVisible()
    // A section's name keeps every row in it.
    await search.fill('operate')
    await expect(more.getByRole('link', { name: 'Traces', exact: true })).toBeVisible()
    await expect(more.getByRole('link', { name: 'Backends', exact: true })).toBeVisible()
    await expect(more.getByRole('link', { name: 'Agents', exact: true })).toHaveCount(0)
  })

  test('More search cannot reveal administrator pages to a regular user', async ({ page }) => {
    await page.route('**/api/auth/status', route => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ authEnabled: true, user: { role: 'user', permissions: {} } }),
    }))
    await page.goto('/app/more')
    const more = page.locator('.more-page')
    await more.getByRole('searchbox', { name: 'Search' }).fill('settings')
    await expect(more.getByRole('link', { name: 'Settings', exact: true })).toHaveCount(0)
    await expect(more.getByRole('status')).toBeVisible()
  })

  test('narrow chat retains a usable message field and 44px controls', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    await page.goto('/app/chat')
    await expect(page.getByRole('textbox', { name: 'Message...' })).toBeVisible()
    await page.getByRole('button', { name: 'Attachments and tools' }).click()
    for (const selector of ['.chat-tools-btn', '.chat-attach-btn', '.chat-send-btn', '.chat-mode-chip', '.chat-header-model > button.input']) {
      const box = await page.locator(selector).boundingBox()
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.width).toBeGreaterThanOrEqual(44)
    }
    const field = await page.locator('.chat-input').boundingBox()
    expect(field.width).toBeGreaterThanOrEqual(160)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
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

test.describe('the phone composer', () => {
  test.use(phone)

  test('gives text a full row, with attach, Canvas and MCP in a sheet', async ({ page }) => {
    await page.goto('/app/chat')
    // By class, not role: the open sheet hides the page behind it, trigger
    // included, from the accessibility tree, as a modal sheet should.
    const tools = page.locator('.chat-tools-btn')
    const field = page.locator('.chat-input')
    await expect(page.locator('.chat-input-modes')).toBeHidden()
    const fieldBox = await field.boundingBox()
    const toolsBox = await tools.boundingBox()
    const sendBox = await page.locator('.chat-send-btn').boundingBox()
    expect(fieldBox.width).toBeGreaterThan(300)
    expect(fieldBox.y + fieldBox.height).toBeLessThanOrEqual(toolsBox.y + 1)
    expect(Math.round(toolsBox.y)).toBe(Math.round(sendBox.y))

    await tools.click()
    await expect(tools).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('button', { name: 'Attach file' })).toBeVisible()
    await page.getByRole('button', { name: 'Canvas' }).click()
    // Choosing Canvas closes the sheet; the dot keeps its state visible.
    await expect(tools).toBeFocused()
    await field.click()
    await expect(page.locator('.chat-input-modes')).toBeHidden()
    await expect(tools).toHaveClass(/chat-tools-btn--active/)
    await expect(field).toHaveCSS('outline-style', 'none')
  })

  test('the tools sheet rows match: icon and label at the same offsets, same weight and colour', async ({ page }) => {
    await page.goto('/app/chat')
    await page.locator('.chat-tools-btn').click()
    const rows = page.locator('.phone-chat-tools .chat-input-modes > button, .phone-chat-tools .chat-mcp-dropdown > button')
    await expect(rows).toHaveCount(3)
    const offsets = await rows.evaluateAll(buttons => buttons.map(button => {
      const icon = button.querySelector('svg, i').getBoundingClientRect()
      const label = document.createRange()
      label.selectNodeContents(button.querySelector('.chat-mode-chip-label') || [...button.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()))
      return [Math.round(icon.x), Math.round(label.getBoundingClientRect().x), getComputedStyle(button).fontWeight, getComputedStyle(button).color]
    }))
    expect(new Set(offsets.map(o => o.join()))).toHaveProperty('size', 1)
  })

  test('chat settings show the model details and the reply speed', async ({ page }) => {
    await page.route('**/api/models/capabilities', route => route.fulfill({
      json: { data: [{ id: 'alpha-7b', capabilities: ['FLAG_CHAT'] }] },
    }))
    await page.route('**/api/models/config-json/alpha-7b', route => route.fulfill({ json: {
      name: 'alpha-7b', backend: 'llama-cpp', parameters: { model: 'alpha-7b-instruct.Q4_K_M.gguf' },
      context_size: 8192, gpu_layers: 99, threads: 8, template: { chat_message: '{{.Content}}' },
    } }))
    await page.route('**/v1/chat/completions', async route => {
      // A short delay so the speed has elapsed time to divide by.
      await new Promise(resolve => setTimeout(resolve, 300))
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"choices":[{"delta":{"content":"Hello "}}]}\n\n'
          + 'data: {"choices":[{"delta":{"content":"there"}}]}\n\n'
          + 'data: [DONE]\n\n',
      })
    })
    await page.goto('/app/chat')
    await page.locator('.chat-input').fill('Hi')
    await page.locator('.chat-send-btn').click()
    await expect(page.locator('.chat-message-assistant')).toContainText('Hello there')

    await page.getByRole('button', { name: 'Chat settings' }).click()
    const sheet = page.locator('.phone-chat-settings')
    for (const [label, value] of [['Model file', 'alpha-7b-instruct.Q4_K_M.gguf'], ['Context size', '8192'], ['GPU layers', '99'], ['Threads', '8'], ['Chat template', 'Yes']]) {
      await expect(sheet.getByText(label, { exact: true })).toBeVisible()
      await expect(sheet.getByText(value, { exact: true })).toBeVisible()
    }
    await expect(sheet.getByText('Speed', { exact: true })).toBeVisible()
    await expect(sheet.getByText('Peak speed', { exact: true })).toBeVisible()
    await expect(sheet.getByText(/^[\d.]+ tok\/s$/).first()).toBeVisible()
  })

  test('desktop keeps the modes and attach button in the composer', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/app/chat')
    await expect(page.locator('.chat-tools-btn')).toHaveCount(0)
    await expect(page.locator('.chat-input-modes')).toBeVisible()
    await expect(page.locator('.chat-attach-btn')).toBeVisible()
  })

  test('a picker sheet rises above the on-screen keyboard', async ({ page }) => {
    // Chromium has no on-screen keyboard; stand in for iOS, where the
    // keyboard shrinks the visual viewport and leaves innerHeight alone.
    await page.addInitScript(() => {
      const vv = new EventTarget()
      Object.assign(vv, { height: window.innerHeight, width: window.innerWidth, offsetTop: 0, offsetLeft: 0, scale: 1, pageTop: 0, pageLeft: 0 })
      Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true })
      window.__keyboard = (h) => { vv.height = window.innerHeight - h; vv.dispatchEvent(new Event('resize')) }
    })
    await page.route('**/api/models/capabilities', route => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: ['alpha-7b', 'beta-3b'].map(id => ({ id, capabilities: ['FLAG_CHAT'] })) }),
    }))
    await page.goto('/app/chat')
    await page.locator('.chat-header-model > button.input').click()
    const panel = page.locator('.searchable-select__panel')
    await expect.poll(async () => Math.round((await panel.boundingBox()).y + (await panel.boundingBox()).height)).toBe(844)
    await page.evaluate(() => window.__keyboard(336))
    await expect.poll(async () => Math.round((await panel.boundingBox()).y + (await panel.boundingBox()).height)).toBe(508)
    expect((await panel.boundingBox()).y).toBeGreaterThanOrEqual(0)
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
    const items = page.locator('.phone-chat-welcome').getByRole('button').filter({ hasText: /Earlier|Older/ })
    await expect(items).toHaveCount(2)
    // Rows touch, split by a hairline, instead of floating bordered cards.
    const [a, b] = await items.evaluateAll(els => els.map(el => el.getBoundingClientRect()))
    expect(Math.round(b.top)).toBe(Math.round(a.bottom))
    await expect(items.first()).toHaveCSS('border-top-width', '0px')
    // Attachments have one entry in the composer sheet.
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

test.describe('chat keyboard viewport', () => {
  test.use(phone)

  test('the composer stays above a keyboard that only shrinks the visual viewport', async ({ page }) => {
    await page.addInitScript(() => {
      const viewport = new EventTarget()
      Object.assign(viewport, { height: window.innerHeight, width: window.innerWidth, offsetTop: 0, scale: 1 })
      Object.defineProperty(window, 'visualViewport', { value: viewport, configurable: true })
      window.__chatKeyboard = height => {
        viewport.height = window.innerHeight - height
        viewport.dispatchEvent(new Event('resize'))
      }
    })
    await page.goto('/app/chat')
    await expect(page.locator('.chat-input')).toBeVisible()
    await page.evaluate(() => window.__chatKeyboard(336))
    await expect.poll(async () => Math.round((await page.locator('.chat-input-area').boundingBox()).y + (await page.locator('.chat-input-area').boundingBox()).height)).toBe(508)
    await expect(page.locator('.chat-input')).toBeVisible()
    await page.evaluate(() => window.__chatKeyboard(0))
    await expect.poll(async () => Math.round((await page.locator('.chat-input-area').boundingBox()).y + (await page.locator('.chat-input-area').boundingBox()).height)).toBe(844)
  })
})
