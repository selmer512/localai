import { test, expect } from './coverage-fixtures.js'

// Explore → Hugging Face searches the Hub from the browser and hands a picked
// repo to the importer. The Hub is mocked: tests never leave the machine.

const HUB = 'https://huggingface.co/api/models**'
const RESULTS = [
  { id: 'nvidia/parakeet-tdt-0.6b-v3', downloads: 1234567, likes: 890, pipeline_tag: 'automatic-speech-recognition' },
  { id: 'meta-llama/Llama-4-Scout-GGUF', downloads: 45000, likes: 12, pipeline_tag: 'text-generation', gated: 'manual' },
]

async function mockHub(page, body = RESULTS) {
  const requests = []
  await page.route(HUB, route => {
    requests.push(new URL(route.request().url()))
    return route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) })
  })
  return requests
}

const lastRequest = (requests) => requests[requests.length - 1]

test('switching Explore to Hugging Face searches the Hub and imports a pick', async ({ page }) => {
  const requests = await mockHub(page)
  await page.goto('/app/models')
  await page.getByRole('radio', { name: /Hugging Face/ }).click()
  await expect(page).toHaveURL(/source=hf/)

  await expect(page.getByTestId('hf-result')).toHaveCount(2)
  // GGUF by default, ranked by downloads: what LocalAI runs most readily.
  expect(lastRequest(requests).searchParams.get('filter')).toBe('gguf')
  expect(lastRequest(requests).searchParams.get('sort')).toBe('downloads')
  await expect(page.getByTestId('hf-result').nth(1)).toContainText('Gated')

  await page.getByPlaceholder('Search Hugging Face models…').fill('parakeet')
  await expect.poll(() => lastRequest(requests).searchParams.get('search')).toBe('parakeet')

  await page.getByRole('button', { name: /Speech to text/ }).click()
  await expect.poll(() => lastRequest(requests).searchParams.get('pipeline_tag')).toBe('automatic-speech-recognition')
  await page.getByRole('button', { name: 'Any format' }).click()
  await expect.poll(() => lastRequest(requests).searchParams.has('filter')).toBe(false)

  await page.getByTestId('hf-result').first().getByRole('button', { name: /Import/ }).click()
  await expect(page).toHaveURL(/\/app\/import-model\?uri=huggingface%3A%2F%2Fnvidia%2Fparakeet-tdt-0\.6b-v3/)
  await expect(page.getByTestId('import-source-input')).toHaveValue('huggingface://nvidia/parakeet-tdt-0.6b-v3')

  // Back returns to the Hub search, not the gallery.
  await page.goBack()
  await expect(page.getByTestId('hf-search')).toBeVisible()
})

test('an unreachable Hub says so and can be retried', async ({ page }) => {
  let fail = true
  await page.route(HUB, route => fail
    ? route.abort('internetdisconnected')
    : route.fulfill({ contentType: 'application/json', body: JSON.stringify(RESULTS) }))
  await page.goto('/app/models?source=hf')
  await expect(page.getByTestId('hf-error')).toBeVisible()
  fail = false
  await page.getByRole('button', { name: /Try again/ }).click()
  await expect(page.getByTestId('hf-result')).toHaveCount(2)
})

test('the gallery stays the default source', async ({ page }) => {
  const requests = await mockHub(page)
  await page.goto('/app/models')
  await expect(page.getByRole('radio', { name: /LocalAI gallery/ })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByTestId('hf-search')).toHaveCount(0)
  expect(requests).toHaveLength(0)
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('results fit the screen and Import is a full-width target', async ({ page }) => {
    await mockHub(page)
    await page.goto('/app/models?source=hf')
    const first = page.getByTestId('hf-result').first()
    await expect(first).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const row = await first.boundingBox()
    const btn = await first.getByRole('button', { name: /Import/ }).boundingBox()
    expect(btn.width).toBeGreaterThan(row.width * 0.6)
    expect(btn.height).toBeGreaterThanOrEqual(40)
  })

  test('filter chips sit in single swipeable rows', async ({ page }) => {
    await mockHub(page)
    await page.goto('/app/models?source=hf')
    const rows = page.locator('.hf-search__chips')
    await expect(rows).toHaveCount(2)
    for (const row of await rows.all()) {
      const chips = await row.locator('.filter-btn').evaluateAll(els => els.map(e => e.getBoundingClientRect().top))
      expect(new Set(chips.map(Math.round)).size).toBe(1)
    }
    // The page itself never scrolls sideways.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    // Tag shown as words, not the Hub's machine name.
    await expect(page.getByTestId('hf-result').first()).toContainText('Speech to text')
  })
})
