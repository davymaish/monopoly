import { describe, expect, it } from 'vitest'
import {
  createInitialPropertyOwnership,
  getOwnedPropertyIds,
  isValidPropertyOwnership,
} from '../game/ownership'

describe('property ownership state', () => {
  it('starts every purchasable board space unowned', () => {
    const ownership = createInitialPropertyOwnership()

    expect(Object.values(ownership).every((ownerId) => ownerId === null)).toBe(true)
    expect(isValidPropertyOwnership(ownership, ['player-1', 'player-2'])).toBe(true)
  })

  it('derives a player’s holdings from the independent ownership map', () => {
    const ownership = {
      ...createInitialPropertyOwnership(),
      'mediterranean-avenue': 'player-1',
    }

    expect(getOwnedPropertyIds(ownership, 'player-1')).toEqual(['mediterranean-avenue'])
    expect(getOwnedPropertyIds(ownership, 'player-2')).toEqual([])
    expect(isValidPropertyOwnership(ownership, ['player-1', 'player-2'])).toBe(true)
  })

  it('rejects owners not in the active player list and non-purchasable board keys', () => {
    const initialOwnership = createInitialPropertyOwnership()

    expect(
      isValidPropertyOwnership({ ...initialOwnership, 'mediterranean-avenue': 'player-3' }, [
        'player-1',
        'player-2',
      ]),
    ).toBe(false)
    expect(
      isValidPropertyOwnership({ ...initialOwnership, go: 'player-1' }, ['player-1', 'player-2']),
    ).toBe(false)
  })
})
