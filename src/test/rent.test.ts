import { describe, expect, it } from 'vitest'
import { createInitialPropertyOwnership } from '../game/ownership'
import {
  calculateRailroadRent,
  calculateStreetRent,
  calculateUtilityPropertyRent,
} from '../game/rent'

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

describe('calculateRailroadRent', () => {
  it.each([
    [25, 1],
    [50, 2],
    [100, 3],
    [200, 4],
  ])('returns $%i rent when the owner holds %i railroad(s)', (expectedRent, ownedCount) => {
    const railroadIds = [
      'reading-railroad',
      'pennsylvania-railroad',
      'b-and-o-railroad',
      'short-line-railroad',
    ]
    const ownership = {
      ...createInitialPropertyOwnership(),
      ...Object.fromEntries(railroadIds.slice(0, ownedCount).map((id) => [id, 'player-1'])),
    }

    expect(calculateRailroadRent('reading-railroad', ownership)).toBe(expectedRent)
  })

  it('doubles the rent when a card effect supplies the railroad rent multiplier', () => {
    const ownership = {
      ...createInitialPropertyOwnership(),
      'reading-railroad': 'player-1',
      'pennsylvania-railroad': 'player-1',
    }

    expect(calculateRailroadRent('reading-railroad', ownership, 2)).toBe(100)
  })

  it('returns zero for unowned, unknown, or non-railroad deeds', () => {
    const ownership = createInitialPropertyOwnership()

    expect(calculateRailroadRent('reading-railroad', ownership)).toBe(0)
    expect(calculateRailroadRent('unknown-property', ownership)).toBe(0)
    expect(calculateRailroadRent('vermont-avenue', ownership)).toBe(0)
  })
})

describe('calculateUtilityPropertyRent', () => {
  it('uses four times the dice total when the owner holds one utility', () => {
    const ownership = {
      ...createInitialPropertyOwnership(),
      'electric-company': 'player-1',
    }

    expect(calculateUtilityPropertyRent('electric-company', ownership, 7)).toBe(28)
  })

  it('uses ten times the dice total when the owner holds both utilities', () => {
    const ownership = {
      ...createInitialPropertyOwnership(),
      'electric-company': 'player-1',
      'water-works': 'player-1',
    }

    expect(calculateUtilityPropertyRent('electric-company', ownership, 7)).toBe(70)
  })

  it('uses the nearest-utility card multiplier regardless of the normal utility count', () => {
    const ownership = {
      ...createInitialPropertyOwnership(),
      'electric-company': 'player-1',
    }

    expect(calculateUtilityPropertyRent('electric-company', ownership, 7, true)).toBe(70)
  })

  it('returns zero for unowned, unknown, or non-utility deeds', () => {
    const ownership = createInitialPropertyOwnership()

    expect(calculateUtilityPropertyRent('electric-company', ownership, 7)).toBe(0)
    expect(calculateUtilityPropertyRent('unknown-property', ownership, 7)).toBe(0)
    expect(calculateUtilityPropertyRent('vermont-avenue', ownership, 7)).toBe(0)
  })
})
