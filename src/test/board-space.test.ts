import { describe, expect, it } from 'vitest'
import type { BoardSpace } from '../game/board-space'

const sampleSpaces = [
  { id: 'property', position: 1, name: 'Example Street', kind: 'property', group: 'brown' },
  { id: 'railroad', position: 5, name: 'Example Railroad', kind: 'railroad' },
  {
    id: 'utility',
    position: 12,
    name: 'Example Utility',
    kind: 'utility',
    utility: 'electric-company',
  },
  { id: 'tax', position: 4, name: 'Income Tax', kind: 'tax', tax: 'income' },
  { id: 'card', position: 7, name: 'Chance', kind: 'card', deck: 'chance' },
  { id: 'corner', position: 10, name: 'Jail', kind: 'corner', corner: 'jail' },
  { id: 'parking', position: 20, name: 'Free Parking', kind: 'parking' },
] satisfies BoardSpace[]

const invalidProperty: BoardSpace = {
  id: 'invalid-property',
  position: 1,
  name: 'Invalid Property',
  kind: 'property',
  // @ts-expect-error: property groups are limited to the defined color groups
  group: 'chance',
}

void invalidProperty

describe('BoardSpace', () => {
  it('models each discriminated board-space kind', () => {
    expect(sampleSpaces.map((space) => space.kind)).toEqual([
      'property',
      'railroad',
      'utility',
      'tax',
      'card',
      'corner',
      'parking',
    ])
  })
})
