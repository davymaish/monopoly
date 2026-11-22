import type { BoardSpace } from './board-space'
import { RAILROADS } from './railroad-data'
import { STREET_PROPERTIES } from './street-data'
import { UTILITIES } from './utility-data'

/** Special-space positions follow the classic U.S. board, converted from 1-based numbering. */
export const SPECIAL_SPACES = [
  { id: 'go', position: 0, name: 'GO', kind: 'corner', corner: 'go' },
  {
    id: 'community-chest-1',
    position: 2,
    name: 'Community Chest',
    kind: 'card',
    deck: 'community-chest',
  },
  { id: 'income-tax', position: 4, name: 'Income Tax', kind: 'tax', tax: 'income' },
  { id: 'chance-1', position: 7, name: 'Chance', kind: 'card', deck: 'chance' },
  { id: 'jail', position: 10, name: 'Jail / Just Visiting', kind: 'corner', corner: 'jail' },
  {
    id: 'community-chest-2',
    position: 17,
    name: 'Community Chest',
    kind: 'card',
    deck: 'community-chest',
  },
  { id: 'free-parking', position: 20, name: 'Free Parking', kind: 'parking' },
  { id: 'chance-2', position: 22, name: 'Chance', kind: 'card', deck: 'chance' },
  {
    id: 'go-to-jail',
    position: 30,
    name: 'Go to Jail',
    kind: 'corner',
    corner: 'go-to-jail',
  },
  {
    id: 'community-chest-3',
    position: 33,
    name: 'Community Chest',
    kind: 'card',
    deck: 'community-chest',
  },
  { id: 'chance-3', position: 36, name: 'Chance', kind: 'card', deck: 'chance' },
  { id: 'luxury-tax', position: 38, name: 'Luxury Tax', kind: 'tax', tax: 'luxury' },
] as const satisfies readonly BoardSpace[]

const boardSpaces: BoardSpace[] = [
  ...SPECIAL_SPACES,
  ...STREET_PROPERTIES,
  ...RAILROADS,
  ...UTILITIES,
]

export const BOARD_SPACES: readonly BoardSpace[] = boardSpaces.sort(
  (left, right) => left.position - right.position,
)
