import { describe, expect, it } from 'vitest'
import { createInitialPropertyOwnership } from '../game/ownership'
import { calculateStreetRent } from '../game/rent'

describe('calculateStreetRent', () => {
  it('returns the printed base rent for an owned street without a complete group', () => {
    const ownership = {
      ...createInitialPropertyOwnership(),
      'vermont-avenue': 'player-1',
    }

    expect(calculateStreetRent('vermont-avenue', ownership)).toBe(6)
  })

  it('returns zero for unowned, unknown, and non-street deeds', () => {
    const ownership = createInitialPropertyOwnership()

    expect(calculateStreetRent('vermont-avenue', ownership)).toBe(0)
    expect(calculateStreetRent('unknown-property', ownership)).toBe(0)
    expect(calculateStreetRent('reading-railroad', ownership)).toBe(0)
  })

  it('returns double rent only when the deed owner holds the complete color group', () => {
    const ownership = {
      ...createInitialPropertyOwnership(),
      'oriental-avenue': 'player-1',
      'vermont-avenue': 'player-1',
      'connecticut-avenue': 'player-1',
    }

    expect(calculateStreetRent('vermont-avenue', ownership)).toBe(12)
  })

  it('uses base rent while any property in the color group is owned by someone else', () => {
    const ownership = {
      ...createInitialPropertyOwnership(),
      'oriental-avenue': 'player-1',
      'vermont-avenue': 'player-1',
      'connecticut-avenue': 'player-2',
    }

    expect(calculateStreetRent('vermont-avenue', ownership)).toBe(6)
  })
})
