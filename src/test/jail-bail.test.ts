import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function createJailedState(cash: number): GameState {
  const initialState = createInitialGameState(setup)
  return {
    ...initialState,
    players: initialState.players.map((player, index) =>
      index === 0 ? { ...player, cash, position: 10, isInJail: true, jailTurns: 1 } : player,
    ),
  }
}

describe('Jail bail', () => {
  it('charges $50, releases the player, and leaves the roll available', () => {
    const state = createJailedState(1500)
    const bailedState = gameReducer(state, { type: 'pay-jail-bail' })

    expect(bailedState.players[0]).toMatchObject({
      cash: 1450,
      position: 10,
      isInJail: false,
      jailTurns: 0,
    })
    expect(bailedState).toMatchObject({ phase: 'awaiting-roll', dice: null, debtResolution: null })
    expect(bailedState.log.map(({ event }) => event)).toEqual([
      { type: 'payment', payerId: 'player-1', payeeId: null, amount: 50, reason: 'jail-bail' },
      { type: 'released-from-jail', playerId: 'player-1', method: 'bail' },
    ])
    expect(state.players[0]).toMatchObject({ cash: 1500, isInJail: true })
  })

  it('routes an unaffordable bail to blocked debt resolution without making cash negative', () => {
    const state = createJailedState(40)
    const debtState = gameReducer(state, { type: 'pay-jail-bail' })

    expect(debtState.players[0]).toMatchObject({ cash: 40, position: 10, isInJail: true })
    expect(debtState).toMatchObject({
      phase: 'awaiting-player-action',
      debtResolution: {
        debtorId: 'player-1',
        creditorId: null,
        amount: 50,
        reason: 'jail-bail',
      },
    })
    expect(gameReducer(debtState, { type: 'roll-jail-attempt', dice: [2, 2] })).toBe(debtState)
    expect(gameReducer(debtState, { type: 'end-turn' })).toBe(debtState)
  })

  it('allows a debtor to mortgage property and pay bail before rolling', () => {
    const jailed = createJailedState(40)
    const state: GameState = {
      ...jailed,
      ownership: { ...jailed.ownership, 'mediterranean-avenue': 'player-1' },
    }
    const debt = gameReducer(state, { type: 'pay-jail-bail' })
    const mortgaged = gameReducer(debt, {
      type: 'mortgage-property',
      propertyId: 'mediterranean-avenue',
    })
    const paid = gameReducer(mortgaged, { type: 'pay-debt' })

    expect(paid.players[0]).toMatchObject({ cash: 20, isInJail: false, jailTurns: 0 })
    expect(paid).toMatchObject({ debtResolution: null, phase: 'awaiting-roll', dice: null })
    expect(paid.log.slice(-2).map(({ event }) => event)).toEqual([
      { type: 'payment', payerId: 'player-1', payeeId: null, amount: 50, reason: 'jail-bail' },
      { type: 'released-from-jail', playerId: 'player-1', method: 'bail' },
    ])
  })

  it('rejects bail when the active player is not in Jail or is not at a roll decision', () => {
    const state = createInitialGameState(setup)
    expect(gameReducer(state, { type: 'pay-jail-bail' })).toBe(state)

    const jailedInResolution = {
      ...createJailedState(100),
      phase: 'resolving-turn' as const,
    }
    expect(gameReducer(jailedInResolution, { type: 'pay-jail-bail' })).toBe(jailedInResolution)
  })
})
