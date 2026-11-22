import { describe, expect, it } from 'vitest'
import { createInitialPropertyOwnership } from '../game/ownership'
import { calculateBaseStreetRent } from '../game/rent'

describe('calculateBaseStreetRent', () => {
  it('returns the printed base rent for an owned street without a complete group', () => {
    const ownership = {
      ...createInitialPropertyOwnership(),
      'vermont-avenue': 'player-1',
    }

    expect(calculateBaseStreetRent('vermont-avenue', ownership)).toBe(6)
  })

  it('returns zero for unowned, unknown, and non-street deeds', () => {
    const ownership = createInitialPropertyOwnership()

    expect(calculateBaseStreetRent('vermont-avenue', ownership)).toBe(0)
    expect(calculateBaseStreetRent('unknown-property', ownership)).toBe(0)
    expect(calculateBaseStreetRent('reading-railroad', ownership)).toBe(0)
  })

  it('defers rent for a completed color group to the group-rent rule', () => {
    const ownership = {
      ...createInitialPropertyOwnership(),
      'oriental-avenue': 'player-1',
      'vermont-avenue': 'player-1',
      'connecticut-avenue': 'player-1',
    }

    expect(calculateBaseStreetRent('vermont-avenue', ownership)).toBe(0)
  })
})
