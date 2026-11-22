import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/initial-state'
import { calculateTaxAmount, calculateTaxableWorth } from '../game/tax'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

describe('tax calculations', () => {
  it('offers $200 or 10% of cash plus printed owned-deed prices for income tax', () => {
    const initialState = createInitialGameState(setup)
    const state = {
      ...initialState,
      mortgagedProperties: ['vermont-avenue'],
      ownership: {
        ...initialState.ownership,
        'vermont-avenue': 'player-1',
        'reading-railroad': 'player-1',
      },
      players: initialState.players.map((player) =>
        player.id === 'player-1' ? { ...player, cash: 1494 } : player,
      ),
    }

    expect(calculateTaxableWorth(state, 'player-1')).toBe(1794)
    expect(calculateTaxAmount(state, 'player-1', 'income', 'fixed')).toBe(200)
    expect(calculateTaxAmount(state, 'player-1', 'income', 'percentage')).toBe(179)

    const halfDollarState = {
      ...state,
      players: state.players.map((player) =>
        player.id === 'player-1' ? { ...player, cash: 1495 } : player,
      ),
    }
    expect(calculateTaxAmount(halfDollarState, 'player-1', 'income', 'percentage')).toBe(180)
  })

  it('charges fixed luxury tax and rejects percentage-based luxury tax', () => {
    const state = createInitialGameState(setup)

    expect(calculateTaxAmount(state, 'player-1', 'luxury', 'fixed')).toBe(100)
    expect(calculateTaxAmount(state, 'player-1', 'luxury', 'percentage')).toBeNull()
  })
})
