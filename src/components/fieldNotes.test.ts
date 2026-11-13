import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  browserStorage,
  createThoughtId,
  MAX_NOTES,
  parseThoughts,
  readThoughts,
} from './fieldNotes'

const note = {
  id: 'note-1',
  name: 'A curious mind',
  message: 'A thought, made real.',
  date: '2026-11-13T10:00:00.000Z',
}

describe('Bounded, untrusted browser storage', () => {
  it('accepts only an array of valid notes', () => {
    assert.deepEqual(parseThoughts(JSON.stringify([note])), [note])
    for (const invalid of [null, '', 'bad json', '{}', 'true', '[null,{},42]'])
      assert.deepEqual(parseThoughts(invalid), [])
  })
  it('trims and bounds stored user text', () => {
    const result = parseThoughts(
      JSON.stringify([{ ...note, name: 'x'.repeat(1000), message: 'y'.repeat(5000) }]),
    )
    assert.equal(result[0].name.length, 40)
    assert.equal(result[0].message.length, 600)
  })
  it('rejects corrupt dates and empty notes', () => {
    assert.deepEqual(
      parseThoughts(
        JSON.stringify([
          { ...note, date: 'not a date' },
          { ...note, message: '   ' },
          { ...note, id: '' },
        ]),
      ),
      [],
    )
  })
  it('de-duplicates IDs and caps the retained list', () => {
    const notes = Array.from({ length: 100 }, (_, i) => ({ ...note, id: `note-${i}` }))
    assert.equal(parseThoughts(JSON.stringify([note, note])).length, 1)
    assert.equal(parseThoughts(JSON.stringify(notes)).length, MAX_NOTES)
  })
  it('does not parse oversized storage payloads', () =>
    assert.deepEqual(parseThoughts(' '.repeat(65537)), []))
  it('can be imported and queried safely during SSR', () => {
    assert.equal(browserStorage(), null)
    assert.deepEqual(readThoughts(), [])
  })
})

describe('Compatibility-safe local note identifiers', () => {
  it('creates distinct identifiers', () => assert.notEqual(createThoughtId(), createThoughtId()))
  it('works when randomUUID is missing', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis.crypto, 'randomUUID')
    Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true })
    try {
      assert.match(createThoughtId(), /^[0-9a-f]{32}$/)
    } finally {
      if (descriptor) Object.defineProperty(globalThis.crypto, 'randomUUID', descriptor)
      else Reflect.deleteProperty(globalThis.crypto, 'randomUUID')
    }
  })
  it('still works without the Web Crypto API', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto')!
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true })
    try {
      assert.match(createThoughtId(), /^local-/)
      assert.notEqual(createThoughtId(), createThoughtId())
    } finally {
      Object.defineProperty(globalThis, 'crypto', descriptor)
    }
  })
})
