import type { RailroadSpace } from './board-space'

/**
 * Classic U.S. railroad deed values, cross-checked against the Drexel property table
 * and the MonopolyClub classic railroad rules reference.
 * https://www.cs.drexel.edu/~popyack/Courses/CSP/Wi18/assignments/HW5/MonopolyBoard_prices.html
 * https://monopolyclub.com/rules/classic/railroads
 */
export interface RailroadProperty extends RailroadSpace {
  readonly purchasePrice: number
  readonly mortgageValue: number
  readonly rentByRailroadsOwned: readonly [number, number, number, number]
}

export const RAILROADS = [
  {
    id: 'reading-railroad',
    position: 5,
    name: 'Reading Railroad',
    kind: 'railroad',
    purchasePrice: 200,
    mortgageValue: 100,
    rentByRailroadsOwned: [25, 50, 100, 200],
  },
  {
    id: 'pennsylvania-railroad',
    position: 15,
    name: 'Pennsylvania Railroad',
    kind: 'railroad',
    purchasePrice: 200,
    mortgageValue: 100,
    rentByRailroadsOwned: [25, 50, 100, 200],
  },
  {
    id: 'b-and-o-railroad',
    position: 25,
    name: 'B. & O. Railroad',
    kind: 'railroad',
    purchasePrice: 200,
    mortgageValue: 100,
    rentByRailroadsOwned: [25, 50, 100, 200],
  },
  {
    id: 'short-line-railroad',
    position: 35,
    name: 'Short Line Railroad',
    kind: 'railroad',
    purchasePrice: 200,
    mortgageValue: 100,
    rentByRailroadsOwned: [25, 50, 100, 200],
  },
] as const satisfies readonly RailroadProperty[]
