import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import http from 'node:http'
import https from 'node:https'
import { brotliDecompressSync, gunzipSync } from 'node:zlib'
import { chromium, firefox, webkit, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const baseURL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const report = {
  url: baseURL,
  checkedAt: new Date().toISOString(),
  checks: [],
  engines: {},
  measurements: {},
  accessibility: [],
  browserErrors: [],
  externalRequests: [],
  audioOutput: process.env.PULSE_SERVER
    ? 'Headless PulseAudio output (null sink in this verification run)'
    : 'System audio output',
}
await mkdir('qa/screenshots', { recursive: true })

async function check(engine, name, run) {
  const started = Date.now()
  try {
    const details = await run()
    report.checks.push({
      engine,
      name,
      status: 'passed',
      ms: Date.now() - started,
      ...(details ? { details } : {}),
    })
    console.log(`✓ ${engine}: ${name}`)
  } catch (error) {
    report.checks.push({
      engine,
      name,
      status: 'failed',
      ms: Date.now() - started,
      error: String(error),
    })
    console.error(`✗ ${engine}: ${name}\n${error.stack || error}`)
    process.exitCode = 1
  }
}

// Use raw HTTP, not fetch's automatically decompressed body, for honest transfer sizes.
function rawRequest(path, headers = {}) {
  const url = new URL(path, `${baseURL}/`)
  return new Promise((resolve, reject) => {
    const req = (url.protocol === 'https:' ? https : http).get(url, { headers }, (response) => {
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () =>
        resolve({
          status: response.statusCode,
          headers: response.headers,
          body: Buffer.concat(chunks),
        }),
      )
      response.on('error', reject)
    })
    req.setTimeout(15_000, () => req.destroy(new Error('HTTP request timed out')))
    req.on('error', reject)
  })
}

await check('server', 'SSR, security headers, redirects, and a useful 404', async () => {
  const response = await rawRequest('/thesis')
  assert.equal(response.status, 200)
  assert.equal(response.headers['x-content-type-options'], 'nosniff')
  assert.equal(response.headers['referrer-policy'], 'strict-origin-when-cross-origin')
  assert.match(response.headers['permissions-policy'], /microphone=\(\)/)
  assert.match(response.headers['content-security-policy'], /object-src 'none'/)
  assert.equal(response.headers['cache-control'], 'no-cache')
  assert.equal(
    response.headers['x-frame-options'],
    undefined,
    'The Arena preview must remain embeddable',
  )
  const html = response.body.toString()
  assert.match(html, /application\/ld\+json/)
  assert.match(html, /rel="canonical" href="https:\/\/forthe.tech\/thesis"/)
  assert.equal((html.match(/rel="preload" as="font"/g) || []).length, 2)
  const root = await rawRequest('/')
  assert.equal(root.status, 307)
  assert.equal(root.headers.location, '/thesis')
  const missing = await rawRequest('/__hardening_missing')
  assert.equal(missing.status, 404)
  assert.match(missing.body.toString(), /Return to the thesis/)
  report.measurements.htmlHeaders = response.headers
})

await check(
  'server',
  'Brotli/gzip negotiation, immutable caching, Vary, and conditional requests',
  async () => {
    const html = (await rawRequest('/thesis')).body.toString()
    const assets = [
      ...new Set(
        [...html.matchAll(/(?:href|src)="(\/assets\/[^"<>]+\.(?:js|css))"/g)].map(
          (match) => match[1],
        ),
      ),
    ]
    assert.ok(assets.length >= 3)
    report.measurements.assets = []
    for (const path of assets) {
      const identity = await rawRequest(path, { 'accept-encoding': 'identity' })
      const br = await rawRequest(path, { 'accept-encoding': 'br' })
      const gzip = await rawRequest(path, { 'accept-encoding': 'gzip' })
      for (const response of [identity, br, gzip]) {
        assert.equal(response.status, 200)
        assert.match(response.headers['cache-control'], /immutable/)
        assert.match(response.headers.vary, /Accept-Encoding/i)
        assert.equal(response.headers['x-content-type-options'], 'nosniff')
      }
      assert.equal(br.headers['content-encoding'], 'br')
      assert.equal(gzip.headers['content-encoding'], 'gzip')
      assert.deepEqual(brotliDecompressSync(br.body), identity.body)
      assert.deepEqual(gunzipSync(gzip.body), identity.body)
      assert.ok(br.body.length < identity.body.length * 0.5)
      const unchanged = await rawRequest(path, {
        'accept-encoding': 'br',
        'if-none-match': br.headers.etag,
      })
      assert.equal(unchanged.status, 304)
      assert.equal(unchanged.body.length, 0)
      report.measurements.assets.push({
        path,
        uncompressedBytes: identity.body.length,
        brotliBytes: br.body.length,
        gzipBytes: gzip.body.length,
        brotliReductionPercent: Math.round((1 - br.body.length / identity.body.length) * 1000) / 10,
      })
    }
  },
)

// Browser-only instrumentation, injected by the tests; nothing is shipped in the app.
function installProbe() {
  const qa = (window.__hardening = {
    draws: 0,
    frames: 0,
    pending: new Set(),
    contexts: [],
    observers: { resize: new Set(), intersection: new Set() },
    lcp: null,
    cls: 0,
    longTasks: [],
  })
  for (const [name, key] of [
    ['ResizeObserver', 'resize'],
    ['IntersectionObserver', 'intersection'],
  ]) {
    const Original = window[name]
    window[name] = class extends Original {
      targets = new Set()
      observe(target, options) {
        super.observe(target, options)
        this.targets.add(target)
        qa.observers[key].add(this)
      }
      unobserve(target) {
        super.unobserve(target)
        this.targets.delete(target)
        if (!this.targets.size) qa.observers[key].delete(this)
      }
      disconnect() {
        super.disconnect()
        this.targets.clear()
        qa.observers[key].delete(this)
      }
    }
  }
  const request = window.requestAnimationFrame.bind(window)
  const cancel = window.cancelAnimationFrame.bind(window)
  window.requestAnimationFrame = (callback) => {
    const id = request((time) => {
      qa.pending.delete(id)
      qa.frames++
      callback(time)
    })
    qa.pending.add(id)
    return id
  }
  window.cancelAnimationFrame = (id) => {
    qa.pending.delete(id)
    cancel(id)
  }
  const drawImage = CanvasRenderingContext2D.prototype.drawImage
  CanvasRenderingContext2D.prototype.drawImage = function (...args) {
    qa.draws++
    return drawImage.apply(this, args)
  }
  const Audio = window.AudioContext || window.webkitAudioContext
  if (Audio) {
    class ObservedAudio extends Audio {
      constructor(...args) {
        super(...args)
        qa.contexts.push(this)
      }
    }
    if (window.AudioContext) window.AudioContext = ObservedAudio
    else window.webkitAudioContext = ObservedAudio
  }
  for (const type of ['largest-contentful-paint', 'layout-shift', 'longtask']) {
    if (!PerformanceObserver.supportedEntryTypes?.includes(type)) continue
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (type === 'largest-contentful-paint') qa.lcp = entry.startTime
        if (type === 'layout-shift' && !entry.hadRecentInput) qa.cls += entry.value
        if (type === 'longtask') qa.longTasks.push(entry.duration)
      }
    })
    observer.observe({ type, buffered: true })
  }
}
function watch(page, engine) {
  page.setDefaultTimeout(12_000)
  page.on('pageerror', (error) =>
    report.browserErrors.push({ engine, kind: 'pageerror', message: String(error) }),
  )
  page.on('console', (message) => {
    if (message.type() === 'error')
      report.browserErrors.push({ engine, kind: 'console', message: message.text() })
  })
  page.on('request', (request) => {
    if (
      request.url().startsWith('http') &&
      new URL(request.url()).origin !== new URL(baseURL).origin
    )
      report.externalRequests.push({ engine, url: request.url() })
  })
}
async function ready(page) {
  const response = await page.goto(`${baseURL}/thesis`)
  assert.equal(response.status(), 200)
  await expect(page.locator('.pinned-stage')).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(
    () =>
      document.querySelector('.pinned-stage')?.dataset.reducedMotion ===
      String(matchMedia('(prefers-reduced-motion: reduce)').matches),
  )
}
async function usingPage(browser, engine, options, run, init, beforeReady) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    ...options,
  })
  try {
    context.on('page', (page) => watch(page, engine))
    await context.addInitScript(installProbe)
    if (init) await context.addInitScript(init)
    const page = await context.newPage()
    if (beforeReady) await beforeReady(page)
    await ready(page)
    return await run(page, context)
  } finally {
    await context.close()
  }
}
async function seek(page, progress) {
  await page.evaluate((progress) => {
    const track = document.querySelector('.scroll-track'),
      stage = document.querySelector('.pinned-stage')
    const start = track.getBoundingClientRect().top + scrollY
    scrollTo({
      top: start + (track.offsetHeight - stage.clientHeight) * progress,
      behavior: 'instant',
    })
  }, progress)
  await page.waitForFunction(
    (expected) =>
      Math.abs(Number(document.querySelector('.progress-readout > span').textContent) - expected) <
      0.003,
    progress,
  )
}
async function progress(page) {
  return Number(await page.locator('.progress-readout > span').first().textContent())
}
async function drawCount(page) {
  return page.evaluate(() => window.__hardening.draws)
}
async function assertPaused(page, reason) {
  await page.waitForTimeout(140)
  const before = await drawCount(page)
  await page.waitForTimeout(250)
  assert.equal(await drawCount(page), before, reason)
}
async function audit(page, engine, state) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  const violations = result.violations.map((v) => ({
    id: v.id,
    targets: v.nodes.map((n) => n.target),
  }))
  report.accessibility.push({
    engine,
    state,
    violations,
    needsManualReview: result.incomplete.length,
  })
  assert.deepEqual(violations, [], `Axe violations in ${engine}/${state}`)
}

for (const [engine, browserType] of Object.entries({ chromium, firefox, webkit })) {
  let browser
  try {
    browser = await browserType.launch({ headless: true })
    report.engines[engine] = browser.version()

    await check(engine, 'Reduced motion is event-driven; initial load stays local', () =>
      usingPage(browser, engine, {}, async (page) => {
        await assertPaused(page, 'Reduced motion must not keep drawing at idle')
        assert.equal(await page.evaluate(() => window.__hardening.pending.size), 0)
        assert.equal(
          await page.evaluate(() => window.__hardening.contexts.length),
          0,
          'Audio must not be created before opt-in',
        )
        const measurements = await page.evaluate(() => {
          const qa = window.__hardening,
            navigation = performance.getEntriesByType('navigation')[0]
          return {
            domContentLoadedMs: navigation.domContentLoadedEventEnd,
            loadMs: navigation.loadEventEnd,
            lcpMs: qa.lcp,
            cls: qa.cls,
            longTasks: qa.longTasks,
            resourceBytes: performance
              .getEntriesByType('resource')
              .reduce((sum, r) => sum + r.encodedBodySize, 0),
            canvasPixels:
              document.querySelector('canvas').width * document.querySelector('canvas').height,
          }
        })
        report.measurements[engine] = { initialLoad: measurements }
        assert.ok(measurements.canvasPixels <= 4_000_000)
        await audit(page, engine, 'Prologue')
        for (const [p, chapter] of [
          [0.145, 1],
          [0.29, 2],
          [0.397, 3],
          [0.625, 4],
          [0.8, 5],
          [0.965, 6],
        ]) {
          await seek(page, p)
          await expect(page.locator('.pinned-stage')).toHaveAttribute(
            'data-chapter',
            String(chapter),
          )
          assert.equal(await page.locator('.beat[aria-hidden="false"]').count(), 1)
        }
        await audit(page, engine, 'Becoming')
      }),
    )

    await check(
      engine,
      'Idle editorial writes eliminated; damping and live motion preferences preserved',
      () =>
        usingPage(browser, engine, { reducedMotion: 'no-preference' }, async (page) => {
          await page.evaluate(() => {
            window.__hardening.editorialMutations = 0
            new MutationObserver(
              (records) => (window.__hardening.editorialMutations += records.length),
            ).observe(document.querySelector('.editorial'), {
              attributes: true,
              childList: true,
              subtree: true,
            })
          })
          const before = await drawCount(page)
          await page.waitForTimeout(1000)
          const writes = await page.evaluate(() => window.__hardening.editorialMutations)
          const draws = (await drawCount(page)) - before
          report.measurements[engine].idle = {
            editorialMutationsPerSecond: writes,
            canvasDrawsPerSecond: draws,
          }
          assert.equal(writes, 0)
          assert.ok(draws > 5, 'The standard-motion optical field must remain animated')
          await page.evaluate(() =>
            scrollTo({
              top:
                (document.querySelector('.scroll-track').offsetHeight -
                  document.querySelector('.pinned-stage').clientHeight) *
                0.8,
              behavior: 'instant',
            }),
          )
          await page.waitForTimeout(75)
          const intermediate = await progress(page)
          assert.ok(
            intermediate >= 0 && intermediate < 0.79,
            `Expected damped progress, received ${intermediate}`,
          )
          await page.emulateMedia({ reducedMotion: 'reduce' })
          await expect(page.locator('.pinned-stage')).toHaveAttribute('data-reduced-motion', 'true')
          await page.waitForFunction(
            () =>
              Math.abs(
                Number(document.querySelector('.progress-readout > span').textContent) - 0.8,
              ) < 0.003,
          )
          await assertPaused(page, 'A live reduced-motion change must stop the animation clock')
          await page.emulateMedia({ reducedMotion: 'no-preference' })
          const resume = await drawCount(page)
          await page.waitForTimeout(250)
          assert.ok((await drawCount(page)) > resume)
        }),
    )

    await check(engine, 'Reader focus, owned scroll locks, and chapter return', () =>
      usingPage(browser, engine, {}, async (page) => {
        await seek(page, 0.29)
        await page.evaluate(() => {
          document.body.style.overflow = 'visible'
          document.documentElement.style.overflow = 'auto'
          document.documentElement.style.overscrollBehavior = 'contain'
        })
        const read = page.getByRole('button', { name: 'Read the words', exact: true })
        const original = await page.locator('.pinned-stage').boundingBox()
        const originalY = await page.evaluate(() => scrollY)
        for (let i = 0; i < 3; i++) {
          await read.click()
          await expect(page.locator('dialog')).toBeVisible()
          await expect(page.getByRole('button', { name: 'Close reading view' })).toBeFocused()
          assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden')
          assert.ok(
            Math.abs((await page.locator('.pinned-stage').boundingBox()).width - original.width) <=
              1,
          )
          await page.keyboard.press('ArrowRight')
          assert.ok(
            Math.abs((await progress(page)) - 0.29) < 0.003,
            'Arrow keys inside the reader must not navigate the stage',
          )
          for (let j = 0; j < 10; j++) {
            await page.keyboard.press('Tab')
            assert.equal(
              await page.evaluate(() =>
                document.querySelector('dialog').contains(document.activeElement),
              ),
              true,
            )
          }
          if (i === 0) await audit(page, engine, 'Reading dialog')
          await page.keyboard.press('Escape')
          await expect(page.locator('dialog')).not.toBeVisible()
          await expect(read).toBeFocused()
          assert.equal(
            await page.evaluate(() => scrollY),
            originalY,
            'Reading must preserve scroll position',
          )
          const restored = await page.evaluate(() => ({
            body: document.body.style.overflow,
            root: document.documentElement.style.overflow,
            overscroll: document.documentElement.style.overscrollBehavior,
          }))
          assert.deepEqual(restored, { body: 'visible', root: 'auto', overscroll: 'contain' })
        }
        await read.click()
        await page.locator('.reading-chapter-link').nth(4).click()
        await expect(page.locator('dialog')).not.toBeVisible()
        await expect(page.locator('.pinned-stage')).toHaveAttribute('data-chapter', '5')
        assert.equal(await page.evaluate(() => document.body.style.overflow), 'visible')
      }),
    )

    await check(
      engine,
      'Keyboard respects editable fields, modifiers, rail focus, and hidden chapters',
      () =>
        usingPage(browser, engine, {}, async (page) => {
          await page.getByRole('button', { name: /Begin the experiment/ }).focus()
          await page.keyboard.press('Enter')
          await expect(page.locator('.pinned-stage')).toHaveAttribute('data-chapter', '1')
          assert.equal(
            await page.evaluate(
              () => !!document.activeElement.closest('.beat[aria-hidden="false"]'),
            ),
            true,
            'Focus must move out of a chapter before it becomes inert',
          )
          await page.keyboard.press('ArrowRight')
          await expect(page.locator('.pinned-stage')).toHaveAttribute('data-chapter', '2')
          await page.keyboard.press('Shift+ArrowRight')
          assert.ok(Math.abs((await progress(page)) - 0.29) < 0.003)
          await page.evaluate(() => {
            const editable = document.createElement('div')
            editable.contentEditable = 'true'
            editable.id = 'qa-editable'
            editable.textContent = 'Text navigation'
            Object.assign(editable.style, {
              position: 'fixed',
              top: '200px',
              left: '20px',
              zIndex: '1000',
            })
            document.querySelector('.pinned-stage').append(editable)
            editable.focus()
          })
          await page.keyboard.press('ArrowRight')
          assert.ok(Math.abs((await progress(page)) - 0.29) < 0.003)
          await page.evaluate(() => document.getElementById('qa-editable').remove())
          const chapter = page.getByRole('button', { name: 'Chapter II: The light', exact: true })
          await chapter.focus()
          await page.keyboard.press('ArrowDown')
          await expect(
            page.getByRole('button', { name: 'Chapter III: What we meet', exact: true }),
          ).toBeFocused()
          await expect(page.locator('.pinned-stage')).toHaveAttribute('data-chapter', '3')
          assert.equal(await page.locator('.rail-stop[aria-current="step"]').count(), 1)
        }),
    )

    await check(engine, 'Discussion and return-to-origin navigation hand off keyboard focus', () =>
      usingPage(browser, engine, {}, async (page) => {
        await seek(page, 0.965)
        await page.locator('.closing-link').focus()
        await page.keyboard.press('Enter')
        await expect(page.locator('#discussion')).toBeFocused()
        await page.keyboard.press('Tab')
        await expect(page.locator('#thought-name')).toBeFocused()
        await page.locator('.site-footer > button.text-link').focus()
        await page.keyboard.press('Enter')
        await expect(page.locator('.site-header .brand')).toBeFocused()
        await expect(page.locator('.pinned-stage')).toHaveAttribute('data-chapter', '0')
        await page.locator('.skip-link').focus()
        await page.keyboard.press('Enter')
        await expect(page.locator('#discussion')).toBeFocused()
      }),
    )

    await check(
      engine,
      'Resize preserves progress; document-relative navigation excludes surrounding content',
      () =>
        usingPage(browser, engine, {}, async (page) => {
          await seek(page, 0.8)
          for (const [width, height] of [
            [844, 390],
            [390, 844],
            [1440, 900],
          ]) {
            await page.setViewportSize({ width, height })
            await page.waitForTimeout(180)
            assert.ok(
              Math.abs((await progress(page)) - 0.8) < 0.005,
              `Chapter moved after ${width}×${height} resize`,
            )
            await expect(page.locator('.pinned-stage')).toHaveAttribute('data-chapter', '5')
            assert.equal(
              await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
              false,
            )
          }
          await page.evaluate(() => {
            const banner = document.createElement('div')
            banner.id = 'qa-banner'
            banner.style.height = '240px'
            document.querySelector('.scroll-track').before(banner)
            dispatchEvent(new Event('resize'))
          })
          await page.getByRole('button', { name: 'Chapter IV: The bend', exact: true }).click()
          await page.waitForFunction(
            () =>
              Math.abs(
                Number(document.querySelector('.progress-readout > span').textContent) - 0.625,
              ) < 0.003,
          )
          const position = await page.evaluate(() => {
            const track = document.querySelector('.scroll-track'),
              stage = document.querySelector('.pinned-stage')
            return {
              start: track.getBoundingClientRect().top + scrollY,
              expected: 240 + (track.offsetHeight - stage.clientHeight) * 0.625,
              actual: scrollY,
            }
          })
          assert.equal(position.start, 240)
          assert.ok(Math.abs(position.expected - position.actual) <= 1)
          await seek(page, 1)
          assert.equal(await progress(page), 1)
        }),
    )

    await check(
      engine,
      'Forced colours, zero-sized canvas, and context restoration do not crash',
      () =>
        usingPage(
          browser,
          engine,
          {},
          async (page) => {
            assert.equal(
              await page.evaluate(() => matchMedia('(forced-colors: active)').matches),
              true,
            )
            await expect(page.locator('canvas')).not.toBeVisible()
            await page.getByRole('button', { name: 'Chapter V: The colours', exact: true }).click()
            await expect(page.locator('.pinned-stage')).toHaveAttribute('data-chapter', '5')
            await audit(page, engine, 'Forced colours')
            await page.screenshot({ path: `qa/screenshots/${engine}-forced-colors.png` })
            await page.emulateMedia({ forcedColors: 'none' })
            await expect(page.locator('canvas')).toBeVisible()
            await page.waitForFunction(() => document.querySelector('canvas').width > 300)
            await seek(page, 0.625)
            await page.locator('canvas').evaluate((canvas) => {
              canvas.style.display = 'none'
            })
            await page.waitForTimeout(80)
            await page.locator('canvas').evaluate((canvas) => {
              canvas.style.display = ''
            })
            await expect(page.locator('canvas')).toBeVisible()
            await page.waitForTimeout(80)
            await page
              .locator('canvas')
              .evaluate((canvas) => canvas.dispatchEvent(new Event('contextlost')))
            await assertPaused(page, 'A lost context must not be drawn into')
            const previous = await drawCount(page)
            await seek(page, 0.8)
            assert.equal(await drawCount(page), previous)
            await page
              .locator('canvas')
              .evaluate((canvas) => canvas.dispatchEvent(new Event('contextrestored')))
            assert.ok((await drawCount(page)) > previous)
            await expect(page.locator('.pinned-stage')).toHaveAttribute('data-chapter', '5')
          },
          undefined,
          (page) => page.emulateMedia({ forcedColors: 'active' }),
        ),
    )

    await check(
      engine,
      'High-DPI mobile and 4K desktop canvases stay within the 4-megapixel budget',
      async () => {
        const sizes = []
        for (const [width, height, deviceScaleFactor] of [
          [2560, 1440, 1.5],
          [390, 844, 4],
        ]) {
          await usingPage(
            browser,
            engine,
            { viewport: { width, height }, deviceScaleFactor },
            async (page) => {
              await seek(page, 0.625)
              const size = await page.locator('canvas').evaluate((canvas) => ({
                width: canvas.width,
                height: canvas.height,
                cssWidth: canvas.clientWidth,
                cssHeight: canvas.clientHeight,
                dpr: devicePixelRatio,
              }))
              assert.equal(size.dpr, deviceScaleFactor)
              assert.ok(size.width * size.height <= 4_000_000)
              assert.ok(size.width / size.cssWidth <= 2)
              assert.ok(size.width > 0 && size.height > 0)
              sizes.push(size)
            },
          )
        }
        report.measurements[engine].highDpi = sizes
      },
    )

    await check(
      engine,
      'Audio/rendering pause for reader, page lifecycle, visibility, and offscreen stage',
      () =>
        usingPage(
          browser,
          engine,
          { reducedMotion: 'no-preference', viewport: { width: 1280, height: 600 } },
          async (page) => {
            await seek(page, 0.625)
            const sound = page.locator('.sound-button')
            await sound.click()
            await expect(sound).toHaveAttribute('aria-pressed', 'true')
            assert.equal(await page.evaluate(() => window.__hardening.contexts.length), 1)
            await page.waitForFunction(() => window.__hardening.contexts[0].state === 'running')
            await page.getByRole('button', { name: 'Read the words', exact: true }).click()
            await assertPaused(page, 'Reading must pause the optical clock')
            await page.waitForFunction(() => window.__hardening.contexts[0].state === 'suspended')
            await page.keyboard.press('Escape')
            await page.waitForFunction(() => window.__hardening.contexts[0].state === 'running')
            for (const reason of ['pagehide', 'visibility']) {
              await page.evaluate((reason) => {
                if (reason === 'pagehide')
                  dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))
                else {
                  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
                  document.dispatchEvent(new Event('visibilitychange'))
                }
              }, reason)
              await assertPaused(page, `${reason} must pause the optical clock`)
              await page.waitForFunction(() => window.__hardening.contexts[0].state === 'suspended')
              await page.evaluate((reason) => {
                if (reason === 'pagehide')
                  dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
                else {
                  delete document.hidden
                  document.dispatchEvent(new Event('visibilitychange'))
                }
              }, reason)
              await page.waitForFunction(() => window.__hardening.contexts[0].state === 'running')
            }
            await page.evaluate(() =>
              scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
            )
            await page.waitForFunction(
              () => document.querySelector('.pinned-stage').getBoundingClientRect().bottom <= 0,
            )
            await assertPaused(page, 'An offscreen stage must pause rendering')
            await page.waitForFunction(() => window.__hardening.contexts[0].state === 'suspended')
            await seek(page, 0.625)
            await page.waitForFunction(() => window.__hardening.contexts[0].state === 'running')
            await sound.click()
            await expect(sound).toHaveAttribute('aria-pressed', 'false')
            await page.waitForFunction(() => window.__hardening.contexts[0].state === 'suspended')
          },
        ),
    )

    await check(
      engine,
      'Client-side unmount releases RAF, audio, observers, and reader scroll lock',
      () =>
        usingPage(browser, engine, { reducedMotion: 'no-preference' }, async (page) => {
          await page.locator('.sound-button').click()
          await expect(page.locator('.sound-button')).toHaveAttribute('aria-pressed', 'true')
          await page.getByRole('button', { name: 'Read the words', exact: true }).click()
          await page.evaluate(() => {
            history.pushState(null, '', '/__hardening_unmount')
            dispatchEvent(new PopStateEvent('popstate', { state: history.state }))
          })
          await expect(page.locator('.not-found')).toBeVisible()
          assert.equal(await page.locator('.pinned-stage').count(), 0)
          assert.equal(await page.evaluate(() => document.body.style.overflow), '')
          assert.equal(await page.evaluate(() => document.documentElement.style.overflow), '')
          await page.waitForFunction(() => window.__hardening.contexts[0].state === 'closed')
          assert.equal(await page.evaluate(() => window.__hardening.pending.size), 0)
          assert.deepEqual(
            await page.evaluate(() => ({
              resize: window.__hardening.observers.resize.size,
              intersection: window.__hardening.observers.intersection.size,
            })),
            { resize: 0, intersection: 0 },
          )
          await assertPaused(page, 'An unmounted stage must leave no drawing work behind')
          await page.evaluate(() => {
            dispatchEvent(new Event('resize'))
            dispatchEvent(new Event('scroll'))
            document.dispatchEvent(new Event('visibilitychange'))
          })
          await assertPaused(page, 'Events after unmount must not revive the stage')
          await page.goBack()
          await expect(page.locator('.pinned-stage')).toBeVisible()
          assert.equal(await page.locator('.sound-button').getAttribute('aria-pressed'), 'false')
          assert.equal(
            await page.evaluate(() => window.__hardening.contexts.length),
            1,
            'Re-mount must remain audio-lazy',
          )
        }),
    )

    await check(
      engine,
      'Missing UUID support, escaped user content, whitespace validation, and cross-tab notes',
      () =>
        usingPage(
          browser,
          engine,
          {},
          async (page, context) => {
            const second = await context.newPage()
            await ready(second)
            await page.getByLabel('LEAVE A LITTLE LIGHT').fill('    ')
            await page.locator('.submit-thought').click()
            assert.equal(await page.locator('.saved-thought').count(), 0)
            assert.equal(await page.locator('textarea').evaluate((el) => el.validity.valid), false)
            const literal = '<img src=x onerror="window.__unsafe=true"> A thought, not HTML.'
            await page.getByLabel('YOUR NAME').fill('Legacy browser')
            await page.getByLabel('LEAVE A LITTLE LIGHT').fill(literal)
            await page.locator('.submit-thought').click()
            await expect(page.locator('.saved-thought')).toHaveCount(1)
            await expect(second.locator('.saved-thought')).toHaveCount(1)
            assert.equal(await page.locator('.saved-thought p').textContent(), literal)
            assert.equal(await page.locator('.saved-thought img').count(), 0)
            assert.equal(await page.evaluate(() => window.__unsafe), undefined)
            await expect(page.locator('.form-notice')).toContainText('Saved to this browser')
            await second.locator('.saved-thought button').click()
            await expect(page.locator('.saved-thought')).toHaveCount(0)
            await page.getByLabel('LEAVE A LITTLE LIGHT').fill('Another little light.')
            await page.locator('.submit-thought').click()
            await expect(second.locator('.saved-thought')).toHaveCount(1)
            await second.evaluate(() => localStorage.clear())
            await expect(page.locator('.saved-thought')).toHaveCount(0)
          },
          () => {
            Object.defineProperty(globalThis.crypto, 'randomUUID', {
              value: undefined,
              configurable: true,
            })
          },
        ),
    )

    await check(
      engine,
      'Blocked storage and unavailable Web Audio degrade without a broken page',
      () =>
        usingPage(
          browser,
          engine,
          {},
          async (page) => {
            await page.locator('.sound-button').click()
            await expect(page.locator('.sound-notice')).toContainText('Audio is unavailable')
            await expect(page.locator('.sound-button')).toHaveAttribute('aria-pressed', 'false')
            await page.getByLabel('LEAVE A LITTLE LIGHT').fill('A temporary field note.')
            await page.locator('.submit-thought').click()
            await expect(page.locator('.saved-thought')).toHaveCount(1)
            await expect(page.locator('.form-notice')).toContainText('Saved for this visit')
            await page.locator('.saved-thought button').click()
            await expect(page.locator('.saved-thought')).toHaveCount(0)
          },
          () => {
            Object.defineProperty(window, 'localStorage', {
              configurable: true,
              get() {
                throw new DOMException('Storage blocked', 'SecurityError')
              },
            })
            Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined })
            Object.defineProperty(window, 'webkitAudioContext', {
              configurable: true,
              value: undefined,
            })
            Object.defineProperty(window, 'crypto', { configurable: true, value: undefined })
          },
        ),
    )

    await check(
      engine,
      'A stalled native audio resume releases the busy control with an accessible notice',
      () =>
        usingPage(
          browser,
          engine,
          {},
          async (page) => {
            await page.locator('.sound-button').click()
            await expect(page.locator('.sound-button')).toHaveAttribute('aria-busy', 'false')
            await expect(page.locator('.sound-button')).toBeEnabled()
            await expect(page.locator('.sound-button')).toHaveAttribute('aria-pressed', 'false')
            await expect(page.locator('.sound-notice')).toContainText('Audio is unavailable')
          },
          () => {
            const Audio = window.AudioContext || window.webkitAudioContext
            if (Audio) Audio.prototype.resume = () => new Promise(() => {})
          },
        ),
    )

    await check(engine, 'Unavailable Canvas 2D preserves the full interactive editorial', () =>
      usingPage(
        browser,
        engine,
        {},
        async (page) => {
          await page.getByRole('button', { name: 'Chapter VI: Becoming', exact: true }).click()
          await expect(page.locator('.pinned-stage')).toHaveAttribute('data-chapter', '6')
          await expect(page.locator('.beat[aria-hidden="false"]')).toContainText(
            'You were never meant to remain',
          )
          await page.getByRole('button', { name: 'Read the words', exact: true }).click()
          await expect(page.locator('dialog')).toBeVisible()
          assert.equal(await page.locator('.reading-chapter').count(), 6)
        },
        () => {
          HTMLCanvasElement.prototype.getContext = () => null
        },
      ),
    )

    await check(
      engine,
      'No-JavaScript manifesto remains readable and its local-only form cannot submit',
      async () => {
        const context = await browser.newContext({
          javaScriptEnabled: false,
          viewport: { width: 390, height: 844 },
        })
        try {
          const page = await context.newPage()
          watch(page, engine)
          await page.goto(`${baseURL}/thesis`)
          await expect(page.locator('.no-script-reader')).toBeVisible()
          await expect(page.locator('.scroll-track')).not.toBeVisible()
          assert.equal(await page.locator('.no-script-reader section').count(), 6)
          await expect(page.locator('.submit-thought')).toBeDisabled()
          await expect(page.locator('#thought-name')).toBeDisabled()
          await expect(page.locator('#thought-message')).toBeDisabled()
          await expect(page.locator('form noscript p')).toBeVisible()
          assert.match(
            await page.locator('form noscript').evaluate((el) => el.textContent),
            /This form will not submit anything/,
          )
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
            false,
          )
        } finally {
          await context.close()
        }
      },
    )
  } catch (error) {
    report.checks.push({
      engine,
      name: 'Browser engine initialization',
      status: 'failed',
      error: String(error),
    })
    process.exitCode = 1
    console.error(error)
  } finally {
    await browser?.close()
  }
}

await check('all', 'No uncaught browser errors or external runtime requests', async () => {
  assert.deepEqual(report.browserErrors, [])
  assert.deepEqual(report.externalRequests, [])
})
report.status = report.checks.every((check) => check.status === 'passed') ? 'passed' : 'failed'
await writeFile('qa/hardening-results.json', JSON.stringify(report, null, 2) + '\n')
console.log(
  `\n${report.checks.filter((check) => check.status === 'passed').length}/${report.checks.length} hardening checks passed.`,
)
