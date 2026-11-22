import { describe, expect, it } from 'vitest'
import { BOARD_SPACE_COUNT, calculateDestinationPosition } from '../game/movement'

describe('calculateDestinationPosition', () => {
  it.each([
    { position: 0, dice: [1, 2] as const, destination: 3 },
    { position: 35, dice: [3, 4] as const, destination: 2 },
    { position: 39, dice: [6, 6] as const, destination: 11 },
  ])('moves from $position to $destination', ({ position, dice, destination }) => {
    expect(calculateDestinationPosition(position, dice)).toBe(destination)
  })

  it('keeps every valid board position in range after a maximum roll', () => {
    const destinations = Array.from({ length: BOARD_SPACE_COUNT }, (_, position) =>
      calculateDestinationPosition(position, [6, 6]),
    )

    expect(destinations).toHaveLength(BOARD_SPACE_COUNT)
    expect(destinations.every((position) => position >= 0 && position < BOARD_SPACE_COUNT)).toBe(
      true,
    )
  })

  it.each([-1, 40, 1.5])('rejects invalid starting position %s', (position) => {
    expect(() => calculateDestinationPosition(position, [1, 1])).toThrow(RangeError)
  })
})
