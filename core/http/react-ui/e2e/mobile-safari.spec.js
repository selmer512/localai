import { test, expect } from './coverage-fixtures.js'

// Phone layout contract, at iPhone 13 size with touch and a coarse pointer.
//
// Each test below pins a bug that a full-suite run at this size actually
// found: a column scrolled off the left edge, cards shrink-wrapped to their
// content, a 7,000px code block widening a page, labels squeezed into
// one-word columns, numbers hidden instead of restacked. The sweep at the top
// catches the general class (anything clipped where the user cannot scroll to
// it); the rest pin the specific mechanisms so they cannot quietly return.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

// Several pages hold an SSE stream or poll, so the network never goes idle.
// Wait for the shell and give data-driven layout a beat to land.
async function settle(page) {
  await page.waitForLoadState('load')
  await page.locator('.main-content-inner, .login-page, #root > *').first().waitFor()
  await page.waitForTimeout(800)
}

const json = (page, url, data) =>
  page.route(url, route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) }))

// Elements pushed past either edge of the viewport that the user cannot reach:
// clipped, and not inside something that scrolls sideways. Parked off-canvas
// drawers (fixed, wholly outside) and the closed sidebar are excluded.
function clipped(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth
    const out = []
    const scrolls = (el) => {
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const o = getComputedStyle(a).overflowX
        if (o === 'auto' || o === 'scroll') return true
      }
      return false
    }
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('.sidebar:not(.open), [aria-hidden="true"], .sr-only, .visually-hidden')) continue
      const r = el.getBoundingClientRect()
      if (r.width < 2 || r.height < 2 || (r.right <= vw + 1 && r.left >= -1)) continue
      const s = getComputedStyle(el)
      if (s.visibility === 'hidden' || s.display === 'none') continue
      if (s.position === 'fixed' && (r.left >= vw || r.right <= 0)) continue
      if (scrolls(el)) continue
      if (out.some(o => o.el.contains(el))) continue
      out.push({ el, desc: `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} [${Math.round(r.left)}, ${Math.round(r.right)}]` })
    }
    return out.map(o => o.desc)
  })
}

const ROUTES = [
  '/app', '/app/chat', '/app/studio', '/app/image', '/app/tts', '/app/models',
  '/app/models?view=installed', '/app/backends', '/app/operate', '/app/activity',
  '/app/settings', '/app/traces', '/app/usage', '/app/nodes', '/app/agents',
  '/app/skills', '/app/collections', '/app/import-model', '/app/model-editor',
  '/app/talk', '/app/account', '/app/p2p', '/app/scheduling', '/app/failover',
]

test.describe('every page fits a phone', () => {
  for (const path of ROUTES) {
    test(path, async ({ page }) => {
      await page.goto(path)
      await settle(page)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1)
      expect(await clipped(page)).toEqual([])
      // Safari zooms the page when a focused field's text is under 16px.
      const small = await page.evaluate(() => [...document.querySelectorAll('input, textarea, select')]
        .filter(el => el.offsetParent && !['checkbox', 'radio', 'range', 'color', 'file'].includes(el.type))
        .filter(el => parseFloat(getComputedStyle(el).fontSize) < 16)
        .map(el => el.outerHTML.slice(0, 80)))
      expect(small).toEqual([])
    })
  }
})

test('viewport covers the safe area and every text field avoids iOS zoom', async ({ page }) => {
  await page.goto('/app')
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/)
  await settle(page)
  // Component classes set their own small sizes; the touch rule must beat them.
  const sizes = await page.evaluate(() => ['input', 'textarea', 'home-textarea', 'chat-input'].map(cls => {
    const el = document.createElement(cls === 'home-textarea' || cls === 'chat-input' ? 'textarea' : 'input')
    el.className = cls === 'input' ? 'input' : cls
    document.body.appendChild(el)
    return parseFloat(getComputedStyle(el).fontSize)
  }))
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(16)
})

test.describe('navigation', () => {
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

  test('chrome controls are thumb-sized', async ({ page }) => {
    await page.goto('/app/operate')
    await settle(page)
    const heights = await page.evaluate(() => [
      '.hamburger-btn', '.mobile-header-btn', '.mobile-tabbar__item', '.console-rail-toggle', '.app-footer-links a',
    ].flatMap(sel => [...document.querySelectorAll(sel)].filter(el => el.offsetParent)
      .map(el => ({ sel, h: Math.round(el.getBoundingClientRect().height) }))))
    expect(heights.length).toBeGreaterThan(5)
    for (const { sel, h } of heights) expect(h, sel).toBeGreaterThanOrEqual(44)
  })
})

test.describe('model picker sheet', () => {
  test.beforeEach(async ({ page }) => {
    await json(page, '**/api/models/capabilities', { data: ['alpha-7b', 'beta-3b', 'gamma-vision'].map(id => ({ id, capabilities: ['FLAG_CHAT'] })) })
    await page.goto('/app/chat')
  })

  test('opens as a bottom sheet and selects', async ({ page }) => {
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

  test('Escape closes it even though the search field is not focused', async ({ page }) => {
    // On touch the search field is not autofocused (it would raise the
    // keyboard over the options), so a hardware keyboard's Escape has to be
    // handled by the component, not only by the field.
    const trigger = page.locator('.main-content button.input[aria-haspopup="listbox"]').first()
    await trigger.click()
    await expect(page.locator('.searchable-select__panel')).toBeVisible()
    await expect(page.locator('.searchable-select__panel input')).not.toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.locator('.searchable-select__panel')).toHaveCount(0)
  })
})

test.describe('chat', () => {
  test('focus inside the closed settings drawer cannot scroll the conversation away', async ({ page }) => {
    // The closed drawer is parked off-canvas with a transform, inside an
    // overflow:hidden column. Focusing anything in it (Tab, a screen reader,
    // a programmatic focus) made the browser scroll that column sideways to
    // reveal it, and the whole conversation slid off the screen.
    await page.addInitScript(() => localStorage.setItem('localai_chats_data', JSON.stringify({
      chats: [{ id: 'c1', name: 'Phone', model: 'mock-model', history: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there.' },
      ] }],
      activeChatId: 'c1',
    })))
    await page.goto('/app/chat')
    await expect(page.locator('.chat-message-assistant')).toBeVisible()
    await page.evaluate(() => document.querySelector('.chat-settings-drawer :is(input, button, select, textarea)')?.focus())
    await page.waitForTimeout(100)
    const box = await page.locator('.chat-main').evaluate(el => ({
      scrollLeft: el.scrollLeft,
      header: Math.round(el.querySelector('.chat-header').getBoundingClientRect().left),
    }))
    expect(box).toEqual({ scrollLeft: 0, header: 0 })
  })

  test('the header gives the model picker a full row', async ({ page }) => {
    await json(page, '**/api/models/capabilities', { data: [{ id: 'llama-3.2-3b-instruct', capabilities: ['FLAG_CHAT'] }] })
    await page.goto('/app/chat')
    const picker = page.locator('.chat-header button.input[aria-haspopup="listbox"]')
    await expect(picker).toContainText('llama-3.2-3b-instruct')
    // The full name fits: nothing is cut off with an ellipsis.
    expect(await picker.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  })
})

test.describe('lists and tables restack instead of squeezing', () => {
  test('responsive table cards span the page, not their content', async ({ page }) => {
    const chains = [
      { name: 'chain-a', state: 'primary', active: 'a', active_since: '2026-09-26T09:00:00Z', pinned: null, targets: [{ model: 'a', kind: 'local', warm: true, state: 'healthy' }] },
    ]
    await json(page, '**/api/failover', { chains })
    await page.route('**/api/failover/events', route => route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
      body: `event: snapshot\ndata: ${JSON.stringify({ chains })}\n\n`,
    }))
    await page.goto('/app/failover')
    const row = page.locator('.table--responsive > tbody > tr').first()
    await expect(row).toBeVisible()
    const [r, c] = await Promise.all([row.boundingBox(), page.locator('.table-container').first().boundingBox()])
    expect(r.width).toBeGreaterThan(c.width - 4)
  })

  test('section lanes put the label above the description', async ({ page }) => {
    await page.goto('/app/operate')
    const lane = page.locator('.lanes--sections .lane').first()
    await expect(lane).toBeVisible()
    const [label, desc] = await Promise.all([lane.locator(':scope > :nth-child(1)').boundingBox(), lane.locator(':scope > :nth-child(2)').boundingBox()])
    expect(desc.y).toBeGreaterThanOrEqual(label.y + label.height - 1)
    expect(Math.abs(desc.x - label.x)).toBeLessThan(2)
  })

  test('recommended models keep their size and VRAM on a phone', async ({ page }) => {
    await page.route('**/api/models*', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({
      models: [{ name: 'tiny-chat', description: 'Tiny', backend: 'llama-cpp', installed: false, tags: ['chat'] }],
      allBackends: ['llama-cpp'], allTags: ['chat'], availableModels: 1, installedModels: 0, totalPages: 1, currentPage: 1,
    }) }))
    await json(page, '**/api/models/estimate/*', { sizeBytes: 536870912, sizeDisplay: '512.0 MB', estimates: { 4096: { vramBytes: 734003200, vramDisplay: '700.0 MB' } } })
    await json(page, '**/api/resources', { type: 'cpu', available: false, gpus: [] })
    await page.goto('/app/models')
    const row = page.locator('#rec-models-content .lane', { hasText: 'tiny-chat' })
    await expect(row.getByText('512.0 MB')).toBeVisible({ timeout: 20_000 })
    await expect(row.getByRole('button', { name: 'Install' })).toBeVisible()
  })

  test('models filters stack inside the viewport with data loaded', async ({ page }) => {
    const gallery = ['alpha', 'beta'].map(name => ({ name, backend: 'llama-cpp', installed: false, description: `About ${name}`, tags: ['chat'] }))
    const body = { models: gallery, allBackends: ['llama-cpp'], availableModels: 2, installedModels: 0, totalPages: 1 }
    await json(page, '**/api/models/capabilities', { data: [] })
    await json(page, '**/api/models?*', body)
    await json(page, '**/api/models', body)
    await json(page, '**/api/models/estimate/*', {})
    await json(page, '**/api/backends/usecases', {})
    await json(page, '**/api/aliases', [])
    await json(page, '**/api/nodes', [])
    await page.goto('/app/models')
    const search = page.locator('.models-filters__query .search-bar')
    const backend = page.locator('.models-filters__backend button.input')
    await expect(backend).toBeVisible()
    const [s, b] = await Promise.all([search.boundingBox(), backend.boundingBox()])
    expect(b.y).toBeGreaterThanOrEqual(s.y + s.height)
    expect(b.x).toBeGreaterThanOrEqual(0)
    expect(b.x + b.width).toBeLessThanOrEqual(page.viewportSize().width)
    expect(s.height).toBeLessThan(80)
  })
})

test.describe('page chrome stays compact', () => {
  test('studio generator tabs are one sideways-scrolling row', async ({ page }) => {
    await page.goto('/app/studio')
    const tabs = page.locator('.studio-tab')
    await expect(tabs.first()).toBeVisible()
    const tops = await tabs.evaluateAll(els => [...new Set(els.map(el => Math.round(el.getBoundingClientRect().top)))])
    expect(tops).toHaveLength(1)
    expect(await page.locator('.studio-tabs').evaluate(el => getComputedStyle(el).overflowX)).toBe('auto')
  })

  test('model editor header puts actions under the title', async ({ page }) => {
    await page.goto('/app/model-editor')
    const [title, actions] = await Promise.all([
      page.locator('.me-head .page-title').boundingBox(),
      page.locator('.me-head > .hstack').boundingBox(),
    ])
    expect(actions.y).toBeGreaterThanOrEqual(title.y + title.height - 1)
  })

  test('list tables become full-width cards', async ({ page }) => {
    const usage = {
      viewer: { id: 'local-uuid', name: 'local', role: 'admin', provider: 'local' },
      totals: { prompt_tokens: 1234, completion_tokens: 567, total_tokens: 1801, request_count: 42 },
      usage: [{ bucket: '2026-05-05', model: 'qwen-7b', user_id: 'local-uuid', user_name: 'local', prompt_tokens: 1234, completion_tokens: 567, total_tokens: 1801, request_count: 42 }],
    }
    await json(page, '**/api/usage?**', usage)
    await json(page, '**/api/usage/all?**', usage)
    await page.goto('/app/usage')
    const row = page.locator('.table--responsive > tbody > tr', { hasText: 'qwen-7b' }).first()
    await expect(row).toBeVisible()
    expect(await row.evaluate(el => getComputedStyle(el).display)).toBe('block')
    const [r, c] = await Promise.all([row.boundingBox(), page.locator('.table-container', { has: row }).boundingBox()])
    expect(r.width).toBeGreaterThan(c.width - 4)
  })
})

test.describe('content that used to widen pages', () => {
  test('a long unbroken request body stays inside the media column', async ({ page }) => {
    // "Copy as curl" prints the whole base64 input inline. In a grid column
    // with min-width:auto that one string set the page width (7,000px+).
    await page.goto('/app/image')
    const preview = page.locator('.media-preview').first()
    await expect(preview).toBeAttached()
    await preview.evaluate(el => {
      const pre = document.createElement('pre')
      pre.className = 'request-panel__code'
      pre.innerHTML = `<code>${'QUJD'.repeat(2000)}</code>`
      el.appendChild(pre)
    })
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1)
  })
})

test.describe('home', () => {
  test('quick links are an even grid, not a ragged cluster', async ({ page }) => {
    await page.goto('/app')
    const links = page.locator('.home-quick-links > *')
    await expect(links.first()).toBeVisible()
    expect(await page.locator('.home-quick-links').evaluate(el => getComputedStyle(el).display)).toBe('grid')
    const count = await links.count()
    if (count >= 2) {
      const [a, b] = await Promise.all([links.nth(0).boundingBox(), links.nth(1).boundingBox()])
      expect(Math.abs(a.width - b.width)).toBeLessThan(2)
      expect(a.height).toBeGreaterThanOrEqual(44)
    }
  })
})

test('small labels are at least 11px on a phone', async ({ page }) => {
  await page.goto('/app/operate')
  const dt = page.locator('.operate-headline__cell dt').first()
  await expect(dt).toBeVisible()
  expect(parseFloat(await dt.evaluate(el => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(11)
})

test('the Settings save button paints no stray icon glyph', async ({ page }) => {
  await page.goto('/app/settings')
  const save = page.getByRole('button', { name: /Saved|Save Changes/ })
  await expect(save).toBeVisible()
  // `fas fa-save` on the button itself painted a missing-glyph box before
  // the real icon via the icon class's ::before.
  expect(await save.evaluate(el => getComputedStyle(el, '::before').content)).toMatch(/^(none|normal)$/)
})

test('a landscape phone keeps the rail language control inside the rail', async ({ browser }) => {
  // 844x390 lands on the tablet icon rail. Its language switcher showed the
  // "EN" code, which spilled past the 52px rail.
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  await page.goto('/app')
  const rail = await page.locator('.sidebar').boundingBox()
  const trigger = page.locator('.sidebar .language-switcher-trigger')
  await expect(trigger).toBeAttached()
  const box = await trigger.boundingBox()
  expect(box.x + box.width).toBeLessThanOrEqual(rail.x + rail.width + 1)
  await ctx.close()
})
