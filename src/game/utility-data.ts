import type { UtilitySpace } from './board-space'

/**
 * Classic U.S. utility deed values and rent multipliers, cross-checked against
 * the MonopolyClub classic rules page and the classic Monopoly rents table.
 * https://monopolyclub.com/rules/classic/utilities
 * https://www.falstad.com/monopoly.html
 */
export const UTILITY_RENT_MULTIPLIERS = {
  oneUtility: 4,
  bothUtilities: 10,
} as const

export type UtilitiesOwnedCount = 1 | 2

export interface UtilityProperty extends UtilitySpace {
  readonly purchasePrice: 150
  readonly mortgageValue: 75
  readonly rentMultipliers: typeof UTILITY_RENT_MULTIPLIERS
}

export const UTILITIES = [
  {
    id: 'electric-company',
    position: 12,
    name: 'Electric Company',
    kind: 'utility',
    utility: 'electric-company',
    purchasePrice: 150,
    mortgageValue: 75,
    rentMultipliers: UTILITY_RENT_MULTIPLIERS,
  },
  {
    id: 'water-works',
    position: 28,
    name: 'Water Works',
    kind: 'utility',
    utility: 'water-works',
    purchasePrice: 150,
    mortgageValue: 75,
    rentMultipliers: UTILITY_RENT_MULTIPLIERS,
  },
] as const satisfies readonly UtilityProperty[]

export function calculateUtilityRent(
  diceTotal: number,
  utilitiesOwned: UtilitiesOwnedCount,
): number {
  const multiplier =
    utilitiesOwned === 1
      ? UTILITY_RENT_MULTIPLIERS.oneUtility
      : UTILITY_RENT_MULTIPLIERS.bothUtilities

  return diceTotal * multiplier
}
