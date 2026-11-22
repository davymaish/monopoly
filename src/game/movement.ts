import type { DiceRoll } from './model'

export const BOARD_SPACE_COUNT = 40
export const GO_SALARY = 200

export function calculateDestinationPosition(position: number, dice: DiceRoll): number {
  if (!Number.isInteger(position) || position < 0 || position >= BOARD_SPACE_COUNT) {
    throw new RangeError(`Player position must be between 0 and 39; received ${position}.`)
  }

  const spacesMoved = dice[0] + dice[1]
  return (position + spacesMoved) % BOARD_SPACE_COUNT
}
