import { describe, expect, it } from 'vitest'
import { BOARD_SPACES, SPECIAL_SPACES } from '../game/board'

const expectedNames = [
  'GO',
  'Mediterranean Avenue',
  'Community Chest',
  'Baltic Avenue',
  'Income Tax',
  'Reading Railroad',
  'Oriental Avenue',
  'Chance',
  'Vermont Avenue',
  'Connecticut Avenue',
  'Jail / Just Visiting',
  'St. Charles Place',
  'Electric Company',
  'States Avenue',
  'Virginia Avenue',
  'Pennsylvania Railroad',
  'St. James Place',
  'Community Chest',
  'Tennessee Avenue',
  'New York Avenue',
  'Free Parking',
  'Kentucky Avenue',
  'Chance',
  'Indiana Avenue',
  'Illinois Avenue',
  'B. & O. Railroad',
  'Atlantic Avenue',
  'Ventnor Avenue',
  'Water Works',
  'Marvin Gardens',
  'Go to Jail',
  'Pacific Avenue',
  'North Carolina Avenue',
  'Community Chest',
  'Pennsylvania Avenue',
  'Short Line Railroad',
  'Chance',
  'Park Place',
  'Luxury Tax',
  'Boardwalk',
]

describe('classic board data', () => {
  it('assembles exactly 40 spaces in the classic U.S. board order', () => {
    expect(BOARD_SPACES).toHaveLength(40)
    expect(BOARD_SPACES.map(({ name }) => name)).toEqual(expectedNames)
    expect(BOARD_SPACES.map(({ position }) => position)).toEqual(
      Array.from({ length: 40 }, (_, position) => position),
    )
    expect(new Set(BOARD_SPACES.map(({ id }) => id)).size).toBe(40)
  })

  it('includes the expected number of each purchasable and special space kind', () => {
    const counts = Object.fromEntries(
      ['property', 'railroad', 'utility', 'tax', 'card', 'corner', 'parking'].map((kind) => [
        kind,
        BOARD_SPACES.filter((space) => space.kind === kind).length,
      ]),
    )

    expect(counts).toEqual({
      property: 22,
      railroad: 4,
      utility: 2,
      tax: 2,
      card: 6,
      corner: 3,
      parking: 1,
    })
    expect(SPECIAL_SPACES).toHaveLength(12)
  })
})
