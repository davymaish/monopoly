import { describe, expect, it } from 'vitest'
import type { BoardSpace } from '../game/board-space'
import { BOARD_SPACES } from '../game/board'
import { validateBoardData } from '../game/board-invariants'
import { STREET_PROPERTIES } from '../game/street-data'

describe('board-data invariants', () => {
  it('accepts the complete classic board', () => {
    expect(validateBoardData(BOARD_SPACES)).toEqual([])
  })

  it('rejects duplicate and missing board positions', () => {
    const malformedBoard = BOARD_SPACES.map((space) =>
      space.id === 'go' ? { ...space, position: 1 } : space,
    )

    expect(validateBoardData(malformedBoard)).toEqual(
      expect.arrayContaining(['Duplicate board position: 1.', 'Missing board position: 0.']),
    )
  })

  it('rejects invalid property groups and incomplete rent or building data', () => {
    const firstStreet = STREET_PROPERTIES[0]!
    const invalidStreet = {
      ...firstStreet,
      group: 'purple',
      houseCost: undefined,
      rents: { ...firstStreet.rents, houses: [10, 30] },
    } as unknown as BoardSpace
    const malformedBoard = BOARD_SPACES.map((space) =>
      space.id === invalidStreet.id ? invalidStreet : space,
    )

    expect(validateBoardData(malformedBoard)).toEqual(
      expect.arrayContaining([
        'Property mediterranean-avenue has an invalid group.',
        'Property mediterranean-avenue is missing purchase, mortgage, or building-cost data.',
        'Property mediterranean-avenue has an incomplete rent schedule.',
        'Expected 2 brown properties, received 1.',
      ]),
    )
  })
})
