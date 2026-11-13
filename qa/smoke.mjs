import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const baseURL = process.env.BASE_URL || 'http://localhost:3000'
const report = {
  url: baseURL,
  checkedAt: new Date().toISOString(),
  checks: [],
  accessibility: [],
  browserErrors: [],
}
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
})
const page = await context.newPage()
page.on('pageerror', (error) => report.browserErrors.push(String(error)))
page.on('console', (message) => {
  if (message.type() === 'error') report.browserErrors.push(message.text())
})

async function check(name, run) {
  await run()
  report.checks.push({ name, status: 'passed' })
  console.log(`✓ ${name}`)
}
async function seek(page, progress) {
  await page.evaluate((progress) => {
    const track = document.querySelector('.scroll-track'),
      stage = document.querySelector('.pinned-stage')
    window.scrollTo(0, track.offsetTop + (track.offsetHeight - stage.clientHeight) * progress)
  }, progress)
  await page.waitForFunction(
    (expected) =>
      Math.abs(Number(document.querySelector('.progress-readout > span').textContent) - expected) <
      0.003,
    progress,
  )
}
async function audit(page, name) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  report.accessibility.push({
    name,
    violations: results.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
    needsManualReview: results.incomplete.length,
  })
  assert.equal(
    results.violations.length,
    0,
    `Accessibility violations in ${name}: ${JSON.stringify(results.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })))}`,
  )
}

try {
  await mkdir('qa/screenshots', { recursive: true })
  await check('SSR, route, metadata, local fonts, and the 600vh pinned track', async () => {
    const response = await page.goto(`${baseURL}/thesis`)
    assert.equal(response.status(), 200)
    const html = await response.text()
    assert.ok(html.includes('The Refraction') && html.includes('application/ld+json'))
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.pinned-stage')).toHaveAttribute('data-reduced-motion', 'true')
    await expect(page).toHaveTitle('The Refraction of Thought — for the tech.')
    assert.equal(await page.locator('.rail-stop').count(), 7)
    assert.equal(await page.locator('.scroll-track').evaluate((el) => el.offsetHeight), 5400)
    assert.equal(
      await page.locator('.pinned-stage').evaluate((el) => getComputedStyle(el).position),
      'sticky',
    )
    assert.equal(await page.locator('.sound-button').getAttribute('aria-pressed'), 'false')
    await audit(page, 'Prologue and discussion footer')
    await page.screenshot({ path: 'qa/screenshots/desktop-prologue.png' })
  })

  await check('Ignition CTA and keyboard chapter navigation', async () => {
    await page.getByRole('button', { name: /Begin the experiment/ }).click()
    await expect(page.locator('.pinned-stage')).toHaveAttribute('data-chapter', '1')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.pinned-stage')).toHaveAttribute('data-chapter', '2')
    await expect(page.locator('.rail-stop[data-active="true"]')).toHaveAttribute(
      'aria-label',
      'Chapter II: The light',
    )
    assert.ok(Math.abs((await page.locator('.pinned-stage').boundingBox()).y) < 1)
  })

  await check('Pointer-controlled incident beam', async () => {
    await seek(page, 0.29)
    await page.mouse.move(1100, 220)
    await page.waitForTimeout(80)
    const first = await page.locator('canvas').evaluate((el) => el.toDataURL())
    await page.mouse.move(1100, 690)
    await page.waitForTimeout(80)
    const second = await page.locator('canvas').evaluate((el) => el.toDataURL())
    assert.notEqual(first, second)
  })

  await check('All four surface interactions remain story-locked', async () => {
    await page.getByRole('button', { name: 'Chapter III: What we meet', exact: true }).click()
    await expect(page.locator('.surfaces')).toHaveAttribute('data-surface', '0')
    for (const [label, index] of [
      ['Wall', '1'],
      ['Void', '2'],
      ['Glass', '3'],
      ['Mirror', '0'],
    ]) {
      await page
        .locator('.surface-tabs')
        .getByRole('button', { name: new RegExp(label) })
        .click()
      await expect(page.locator('.surfaces')).toHaveAttribute('data-surface', index)
      await expect(page.locator('.surface-panel[aria-hidden="false"]')).toBeVisible()
    }
  })

  await check(
    'Compression, five spectral bands, emergence, and chapter accessibility',
    async () => {
      for (const [progress, chapter] of [
        [0.145, 1],
        [0.29, 2],
        [0.397, 3],
        [0.625, 4],
        [0.8, 5],
        [0.965, 6],
      ]) {
        await seek(page, progress)
        await expect(page.locator('.pinned-stage')).toHaveAttribute('data-chapter', String(chapter))
        await expect(page.locator('.beat[aria-hidden="false"]')).toBeVisible()
        assert.equal(await page.locator('.beat[aria-hidden="false"]').count(), 1)
        await audit(page, `Chapter ${chapter}`)
        if (chapter === 4) await page.screenshot({ path: 'qa/screenshots/desktop-bend.png' })
      }
      assert.equal(await page.locator('.spectral-legend > div').count(), 5)
      await expect(page.locator('.telemetry-top')).toContainText('STATE / UNBOUNDED')
      await expect(page.locator('.telemetry-value').first()).toContainText('1.520')
      await page.screenshot({ path: 'qa/screenshots/desktop-becoming.png' })
    },
  )

  await check('Reader dialog, focus restoration, Escape, and complete original text', async () => {
    const read = page.getByRole('button', { name: 'Read the words', exact: true })
    await read.click()
    await expect(page.locator('dialog')).toBeVisible()
    assert.equal(await page.locator('.reading-chapter').count(), 6)
    await expect(page.locator('dialog')).toContainText(
      'Sometimes we don’t need to change ourselves.',
    )
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden')
    await audit(page, 'Reading view')
    await page.screenshot({ path: 'qa/screenshots/reading-view.png' })
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog')).not.toBeVisible()
    await expect(read).toBeFocused()
    await page.waitForFunction(() => document.body.style.overflow === '')
    assert.equal(await page.evaluate(() => document.body.style.overflow), '')
  })

  await check('Ambient audio is opt-in and can be muted', async () => {
    const sound = page.locator('.sound-button')
    await sound.click()
    await expect(sound).toHaveAttribute('aria-pressed', 'true')
    await sound.click()
    await expect(sound).toHaveAttribute('aria-pressed', 'false')
  })

  await check('Field notes save locally, survive a reload, and can be removed', async () => {
    await page.evaluate(() => document.getElementById('discussion').scrollIntoView())
    await page.getByLabel('YOUR NAME').fill('Optics QA')
    await page
      .getByLabel('LEAVE A LITTLE LIGHT')
      .fill('The right medium is a team that makes room for curiosity.')
    await page
      .locator('.thought-form')
      .getByRole('button', { name: 'Leave a thought', exact: true })
      .click()
    await expect(page.locator('.saved-thought')).toHaveCount(1)
    await expect(page.locator('.form-notice')).toContainText('Saved to this browser')
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.saved-thought')).toHaveCount(1)
    await page.locator('.saved-thought button').click()
    await expect(page.locator('.saved-thought')).toHaveCount(0)
    await page.screenshot({ path: 'qa/screenshots/discussion.png' })
  })

  for (const [width, height] of [
    [390, 844],
    [375, 667],
    [320, 568],
    [768, 1024],
    [844, 390],
  ]) {
    await check(`Responsive reading and no horizontal overflow: ${width} × ${height}`, async () => {
      const mobileContext = await browser.newContext({
        viewport: { width, height },
        reducedMotion: 'reduce',
        isMobile: true,
        hasTouch: true,
      })
      const mobile = await mobileContext.newPage()
      mobile.on('pageerror', (error) => report.browserErrors.push(`${width}px: ${error}`))
      await mobile.goto(`${baseURL}/thesis`)
      await mobile.waitForLoadState('networkidle')
      for (const progress of [0, 0.145, 0.29, 0.397, 0.431, 0.468, 0.516, 0.625, 0.8, 0.965]) {
        await seek(mobile, progress)
        const layout = await mobile.evaluate(() => {
          const active = document.querySelector('.beat[aria-hidden="false"]'),
            reading = document.querySelector('.editorial')
          const rect = active.getBoundingClientRect(),
            pane = reading.getBoundingClientRect()
          const scrollable = getComputedStyle(reading).overflowY === 'auto'
          const footer = document.querySelector('.stage-footer').getBoundingClientRect()
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            top: rect.top,
            headerBottom: document.querySelector('.site-header').getBoundingClientRect().bottom,
            contentBottom: scrollable ? pane.bottom : rect.bottom,
            footerTop: footer.top,
            scrollable,
          }
        })
        assert.equal(layout.overflow, false, `Horizontal overflow at R=${progress}`)
        assert.ok(
          layout.top > layout.headerBottom + 7,
          `Header overlap at R=${progress}: ${JSON.stringify(layout)}`,
        )
        assert.ok(
          layout.contentBottom < layout.footerTop - 4,
          `Copy clipped at R=${progress}: ${JSON.stringify(layout)}`,
        )
        if (progress === 0.625)
          await mobile.screenshot({ path: `qa/screenshots/mobile-${width}x${height}.png` })
        if (progress === 0 && width === 390)
          await mobile.screenshot({ path: 'qa/screenshots/mobile-prologue.png' })
      }
      if (width === 390) {
        await audit(mobile, 'Mobile closing chapter')
        await seek(mobile, 0.29)
        const before = await mobile.locator('canvas').evaluate((el) => el.toDataURL())
        const scrollBefore = await mobile.evaluate(() => scrollY)
        const touch = await mobileContext.newCDPSession(mobile)
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x: 95, y: 180 }],
        })
        for (const x of [125, 165, 210, 255, 305]) {
          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x, y: 180 }],
          })
        }
        await mobile.waitForTimeout(80)
        const after = await mobile.locator('canvas').evaluate((el) => el.toDataURL())
        assert.notEqual(before, after, 'Horizontal touch drag must steer the incident beam')
        assert.equal(
          await mobile.evaluate(() => scrollY),
          scrollBefore,
          'Touch steering must not move the document',
        )
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await touch.detach()
      }
      await mobileContext.close()
    })
  }

  await check('Standard-motion progress is damped, rather than snapped', async () => {
    const motionContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'no-preference',
    })
    const motion = await motionContext.newPage()
    await motion.goto(`${baseURL}/thesis`)
    await motion.waitForLoadState('networkidle')
    await motion.evaluate(() =>
      window.scrollTo(
        0,
        (document.querySelector('.scroll-track').offsetHeight - innerHeight) * 0.8,
      ),
    )
    await motion.waitForTimeout(75)
    const intermediate = Number(
      await motion.locator('.progress-readout > span').first().textContent(),
    )
    assert.ok(
      intermediate > 0 && intermediate < 0.79,
      `Expected damped intermediate progress; received ${intermediate}`,
    )
    await motion.waitForFunction(
      () =>
        Math.abs(Number(document.querySelector('.progress-readout > span').textContent) - 0.8) <
        0.003,
    )
    await motionContext.close()
  })

  await check('No-JavaScript fallback exposes the entire manifesto', async () => {
    const noJSContext = await browser.newContext({ javaScriptEnabled: false })
    const noJS = await noJSContext.newPage()
    await noJS.goto(`${baseURL}/thesis`)
    await expect(noJS.locator('.no-script-reader')).toBeVisible()
    await expect(noJS.locator('.scroll-track')).not.toBeVisible()
    assert.equal(await noJS.locator('.no-script-reader section').count(), 6)
    await noJSContext.close()
  })

  assert.deepEqual(report.browserErrors, [])
  report.status = 'passed'
  console.log(`\n${report.checks.length} browser checks passed. No browser errors.`)
} catch (error) {
  report.status = 'failed'
  report.error = String(error)
  console.error(error)
  process.exitCode = 1
} finally {
  await writeFile('qa/results.json', JSON.stringify(report, null, 2) + '\n')
  await browser.close()
}
