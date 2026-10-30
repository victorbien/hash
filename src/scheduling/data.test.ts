import { describe, expect, it } from 'vitest'
import { dateTimeInputToIso, localDateTimeInput } from './data'

describe('scheduling timezone conversion', () => {
  it('converts local appointment times in the configured timezone', () => {
    const stored = dateTimeInputToIso('2026-10-27T09:30', 'Asia/Manila')
    expect(stored).toBe('2026-10-27T01:30:00.000Z')
    expect(localDateTimeInput(stored, 'Asia/Manila')).toBe('2026-10-27T09:30')
  })

  it('rejects local times skipped by a daylight-saving transition', () => {
    expect(() => dateTimeInputToIso('2026-09-27T02:30', 'Pacific/Auckland')).toThrow(/daylight-saving/)
  })

  it('rejects ambiguous local times during the daylight-saving transition', () => {
    expect(() => dateTimeInputToIso('2026-04-05T02:30', 'Pacific/Auckland')).toThrow(/occurs twice/)
  })
})
