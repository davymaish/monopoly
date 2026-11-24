import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function createJailedState(cash: number, jailTurns: number): GameState {
  const initialState = createInitialGameState(setup)
  return {
    ...initialState,
    players: initialState.players.map((player, index) =>
      index === 0 ? { ...player, position: 10, isInJail: true, jailTurns, cash } : player,
    ),
  }
}

function failDoublesAttempt(state: GameState): GameState {
  const rolled = gameReducer(state, { type: 'roll-jail-attempt', dice: [2, 3] })
  return gameReducer(rolled, { type: 'move-player' })
}

describe('three-turn Jail limit', () => {
  it('increments failed-attempt turns but does not move or release before the third', () => {
    for (const previousFailedTurns of [0, 1]) {
      const result = failDoublesAttempt(createJailedState(500, previousFailedTurns))

      expect(result.players[0]).toMatchObject({
        cash: 500,
        position: 10,
        isInJail: true,
        jailTurns: previousFailedTurns + 1,
      })
      expect(result.phase).toBe('awaiting-player-action')
      expect(result.log.some(({ event }) => event.type === 'movement')).toBe(false)
    }
  })

  it('charges bail and moves by the third failed roll', () => {
    const result = failDoublesAttempt(createJailedState(100, 2))

    expect(result.players[0]).toMatchObject({
      cash: 50,
      position: 15,
      isInJail: false,
      jailTurns: 0,
    })
    expect(result).toMatchObject({
      phase: 'awaiting-player-action',
      debtResolution: null,
      extraRollAvailable: false,
    })
    expect(result.log.map(({ event }) => event)).toEqual([
      { type: 'roll', playerId: 'player-1', dice: [2, 3] },
      { type: 'payment', payerId: 'player-1', payeeId: null, amount: 50, reason: 'jail-bail' },
      { type: 'released-from-jail', playerId: 'player-1', method: 'bail' },
      { type: 'movement', playerId: 'player-1', from: 10, to: 15, spacesMoved: 5 },
    ])
    expect(result.landingResolution).toMatchObject({ type: 'unowned-property' })
  })

  it('blocks further play with a movement-linked debt when bail is unaffordable', () => {
    const result = failDoublesAttempt(createJailedState(30, 2))

    expect(result.players[0]).toMatchObject({
      cash: 30,
      position: 10,
      isInJail: true,
      jailTurns: 3,
    })
    expect(result).toMatchObject({
      phase: 'awaiting-player-action',
      debtResolution: {
        debtorId: 'player-1',
        amount: 50,
        reason: 'jail-bail',
        resumeJailMovement: true,
      },
    })
    expect(gameReducer(result, { type: 'end-turn' })).toBe(result)
  })

  it('uses a held Jail-free card to satisfy the forced release and complete the saved movement', () => {
    const jailedState = createJailedState(30, 2)
    const withCard: GameState = {
      ...jailedState,
      players: jailedState.players.map((player, index) =>
        index === 0 ? { ...player, getOutOfJailFreeCardCount: 1 } : player,
      ),
      heldJailFreeCards: [{ deck: 'chance', cardId: 'chance-jail-free', playerId: 'player-1' }],
    }
    const debtState = failDoublesAttempt(withCard)
    const result = gameReducer(debtState, { type: 'use-jail-free-card' })

    expect(result.players[0]).toMatchObject({
      cash: 30,
      position: 15,
      isInJail: false,
      jailTurns: 0,
      getOutOfJailFreeCardCount: 0,
    })
    expect(result.debtResolution).toBeNull()
    expect(result.heldJailFreeCards).toEqual([])
    expect(result.decks.chance.at(-1)).toBe('chance-jail-free')
    expect(result.log.at(-1)?.event).toEqual({
      type: 'movement',
      playerId: 'player-1',
      from: 10,
      to: 15,
      spacesMoved: 5,
    })
  })
})
