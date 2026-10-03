import { test, expect } from './coverage-fixtures.js'

// On a phone the assistant's reply plays through a loudspeaker next to the
// mic; when the browser's echo cancellation misses it, the server hears the
// reply as a new user turn and the assistant answers itself in a loop. The
// Talk page pauses the mic for the length of each reply unless the user opts
// into interrupting. WebRTC and the mic are faked so the test can drive the
// server events directly.

const PIPELINE = [{ name: 'voice-pipeline', self_contained: true }]

async function fakeWebRTC(page) {
  await page.addInitScript(() => {
    const track = { kind: 'audio', enabled: true, stop() {} }
    const stream = { getAudioTracks: () => [track], getTracks: () => [track] }
    window.__micTrack = track
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      window.__gumConstraints = constraints
      return stream
    }
    window.RTCPeerConnection = class {
      constructor() {
        this.connectionState = 'new'
        this.iceGatheringState = 'complete'
        this.localDescription = { type: 'offer', sdp: 'v=0' }
      }
      addTrack() {}
      createDataChannel() {
        const dc = { readyState: 'open', send() {}, close() {} }
        window.__dc = dc
        return dc
      }
      async createOffer() { return { type: 'offer', sdp: 'v=0' } }
      async setLocalDescription() {}
      async setRemoteDescription() {
        this.connectionState = 'connected'
        this.onconnectionstatechange?.()
      }
      async getStats() { return new Map() }
      close() {}
    }
  })
  await page.route('**/api/pipeline-models', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(PIPELINE) }))
  await page.route('**/v1/realtime/calls', route => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ sdp: 'v=0', session_id: 's1' }) }))
}

const serverEvent = (page, event) =>
  page.evaluate((e) => window.__dc.onmessage({ data: JSON.stringify(e) }), event)
const micEnabled = (page) => page.evaluate(() => window.__micTrack.enabled)

async function connect(page) {
  await page.goto('/app/talk')
  await page.getByRole('button', { name: /Connect$/ }).click()
  await expect.poll(() => page.evaluate(() => !!window.__dc?.onmessage)).toBe(true)
  await serverEvent(page, { type: 'session.created', session: {} })
}

test.describe('Talk echo guard on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('asks for echo cancellation and pauses the mic while the assistant replies', async ({ page }) => {
    await fakeWebRTC(page)
    await connect(page)

    const constraints = await page.evaluate(() => window.__gumConstraints)
    expect(constraints.audio).toMatchObject({ echoCancellation: true, noiseSuppression: true, autoGainControl: true })

    // Phones default to the guard being on.
    await expect(page.getByLabel(/Interrupt while it speaks/)).not.toBeChecked()
    expect(await micEnabled(page)).toBe(true)

    await serverEvent(page, { type: 'response.created', response: { id: 'r1' } })
    expect(await micEnabled(page)).toBe(false)
    await expect(page.getByTestId('talk-mic-paused')).toBeVisible()

    // The mic stays paused for a short tail after the server finishes, so the
    // last of the reply clears the speaker first.
    await serverEvent(page, { type: 'response.done', response: { id: 'r1', status: 'completed' } })
    expect(await micEnabled(page)).toBe(false)
    await expect.poll(() => micEnabled(page), { timeout: 3000 }).toBe(true)
    await expect(page.getByTestId('talk-mic-paused')).toHaveCount(0)
  })

  test('opting into interruptions keeps the mic live and is remembered', async ({ page }) => {
    await fakeWebRTC(page)
    await connect(page)

    await serverEvent(page, { type: 'response.created', response: { id: 'r1' } })
    expect(await micEnabled(page)).toBe(false)

    // Turning it on mid-reply releases the mic straight away.
    await page.getByLabel(/Interrupt while it speaks/).check()
    expect(await micEnabled(page)).toBe(true)

    await serverEvent(page, { type: 'response.done', response: { id: 'r1', status: 'completed' } })
    await serverEvent(page, { type: 'response.created', response: { id: 'r2' } })
    expect(await micEnabled(page)).toBe(true)

    await page.reload()
    await expect(page.getByLabel(/Interrupt while it speaks/)).toBeChecked()
  })
})

test('desktop keeps barge-in on by default', async ({ page }) => {
  await fakeWebRTC(page)
  await connect(page)
  await expect(page.getByLabel(/Interrupt while it speaks/)).toBeChecked()
  await serverEvent(page, { type: 'response.created', response: { id: 'r1' } })
  expect(await micEnabled(page)).toBe(true)
})

test.describe('Talk toggles on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('label stays on one line beside the checkbox with the explanation underneath', async ({ page }) => {
    await fakeWebRTC(page)
    await page.goto('/app/talk')
    const row = page.locator('label.talk-check', { hasText: 'Interrupt while it speaks' })
    const box = await row.locator('input').boundingBox()
    const label = await row.locator('.talk-check__label').boundingBox()
    const hint = await row.locator('.talk-check__hint').boundingBox()
    // One line of label text, vertically aligned with the checkbox.
    expect(label.height).toBeLessThan(30)
    expect(Math.abs((label.y + label.height / 2) - (box.y + box.height / 2))).toBeLessThan(8)
    // Explanation sits below the label and starts where the label starts.
    expect(hint.y).toBeGreaterThanOrEqual(label.y + label.height - 1)
    expect(Math.abs(hint.x - label.x)).toBeLessThan(2)
  })
})
