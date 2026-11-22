import type { TaxKind } from './board-space'
import type { TaxPaymentChoice, GameState, PlayerId } from './model'
import { getPurchasableDeedById } from './purchasable'

export const INCOME_TAX_FIXED_AMOUNT = 200
export const LUXURY_TAX_AMOUNT = 100

/**
 * Total worth for the income-tax choice is cash plus the printed purchase price
 * of each owned street, railroad, and utility deed. Mortgage status does not
 * change that printed-price valuation; buildings are not implemented yet.
 */
export function calculateTaxableWorth(state: GameState, playerId: PlayerId): number {
  const player = state.players.find(({ id }) => id === playerId)
  if (!player) {
    return 0
  }

  const ownedDeedValue = Object.entries(state.ownership).reduce(
    (total, [propertyId, ownerId]) =>
      ownerId === playerId
        ? total + (getPurchasableDeedById(propertyId)?.purchasePrice ?? 0)
        : total,
    0,
  )

  return player.cash + ownedDeedValue
}

export function calculateTaxAmount(
  state: GameState,
  playerId: PlayerId,
  tax: TaxKind,
  choice: TaxPaymentChoice,
): number | null {
  if (tax === 'luxury') {
    return choice === 'fixed' ? LUXURY_TAX_AMOUNT : null
  }

  if (choice === 'fixed') {
    return INCOME_TAX_FIXED_AMOUNT
  }

  if (choice === 'percentage') {
    return Math.max(0, Math.round(calculateTaxableWorth(state, playerId) * 0.1))
  }

  return null
}
