import { test, expect } from './coverage-fixtures.js'

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const now = Date.now()
    const chat = (id, name, history) => ({ id, name, history, model: 'alpha-7b', systemPrompt: '', mcpServers: [], clientMCPServers: [], mcpResources: [], createdAt: now, updatedAt: now })
    localStorage.setItem('localai_chats_data', JSON.stringify({ activeChatId: 'thread', chats: [
      chat('thread', 'Mobile conversation', [{ role: 'user', content: 'A question' }, { role: 'assistant', content: 'A readable answer with enough text to check the full reading width.' }]),
      chat('earlier', 'Earlier conversation', [{ role: 'user', content: 'Earlier question' }]),
    ] }))
  })
  await page.route('**/api/models/capabilities', route => route.fulfill({ json: { data: [{ id: 'alpha-7b', capabilities: ['FLAG_CHAT'] }] } }))
  await page.goto('/app/chat')
})

test('reply actions work without hover and editing returns to the message', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Mobile conversation' })).toBeVisible()
  const answer = page.locator('.chat-message-assistant')
  await expect(answer.getByRole('button', { name: 'Copy', exact: true })).toBeVisible()
  await answer.getByRole('button', { name: 'Message actions', exact: true }).click()
  const sheet = page.getByRole('dialog', { name: 'Message actions' })
  await expect(sheet.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await expect(sheet.getByRole('button', { name: 'Regenerate', exact: true })).toBeVisible()
  await expect(sheet.getByRole('button', { name: 'Branch from here' })).toBeVisible()
  await sheet.getByRole('button', { name: 'Edit', exact: true }).click()
  const editor = page.getByRole('textbox', { name: 'Edit message' })
  await expect(editor).toBeFocused()
  await editor.fill('The revised answer')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(answer).toContainText('The revised answer')
  await expect(sheet).toHaveCount(0)
})

test('chat search, rename and selection stay in one sheet', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Chats', exact: true })
  await trigger.click()
  const sheet = page.getByRole('dialog', { name: 'Chats', exact: true })
  await expect(sheet.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await sheet.getByRole('searchbox').fill('Earlier')
  await expect(sheet.getByRole('button', { name: /^Mobile conversation/ })).toHaveCount(0)
  await sheet.getByRole('button', { name: 'Conversation actions: Earlier conversation' }).click()
  await sheet.getByRole('button', { name: 'Rename', exact: true }).click()
  await sheet.getByRole('textbox', { name: 'Rename', exact: true }).fill('Earlier notes')
  await sheet.getByRole('button', { name: 'Save', exact: true }).click()
  await sheet.getByRole('button', { name: /^Earlier notes/ }).click()
  await expect(page.getByRole('heading', { name: 'Earlier notes' })).toBeVisible()
  await expect(trigger).toBeFocused()
})

test('advanced settings are optional and clear-history confirmation can be cancelled', async ({ page }) => {
  await page.getByRole('button', { name: 'Chat settings', exact: true }).click()
  const sheet = page.getByRole('dialog', { name: 'Chat Settings' })
  await expect(sheet.getByRole('slider', { name: 'Temperature', exact: true })).toBeHidden()
  await sheet.locator('summary').click()
  const temperature = sheet.getByRole('slider', { name: 'Temperature', exact: true })
  await expect(temperature).toBeVisible()
  await temperature.focus()
  await temperature.press('ArrowRight')
  await expect(temperature).toHaveValue('0.8')
  await sheet.getByRole('textbox', { name: 'System Prompt', exact: true }).fill('Be concise.')
  await sheet.getByRole('button', { name: 'Clear chat history' }).click()
  await page.getByRole('alertdialog', { name: 'Clear chat history' }).getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.locator('.chat-message-assistant')).toContainText('A readable answer')
  await page.getByRole('button', { name: 'Chat settings', exact: true }).click()
  await expect(sheet.getByRole('textbox', { name: 'System Prompt', exact: true })).toHaveValue('Be concise.')
})

test('a long conversation title and replies fit a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  const content = page.locator('.chat-message-assistant .chat-message-content')
  expect((await content.boundingBox()).width).toBeGreaterThanOrEqual(280)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
  for (const button of await page.locator('.phone-chat-header button, .phone-message-actions button, .chat-tools-btn, .chat-send-btn').all()) {
    const box = await button.boundingBox()
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
})
