import { describe, expect, it, vi } from 'vitest'
import type { GameAction } from '../game/actions'
import { createInitialGameState } from '../game/initial-state'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

describe('gameReducer skeleton', () => {
  it('dispatches recognized actions as safe no-ops without mutating or rolling randomly', () => {
    const state = createInitialGameState(setup)
    const initialSnapshot = JSON.stringify(state)
    const actions: GameAction[] = [
      { type: 'end-turn' },
      { type: 'buy-property', propertyId: 'mediterranean-avenue' },
      { type: 'decline-purchase', propertyId: 'mediterranean-avenue' },
    ]
    const randomSpy = vi.spyOn(Math, 'random')

    try {
      for (const action of actions) {
        expect(gameReducer(state, action)).toBe(state)
      }

      expect(JSON.stringify(state)).toBe(initialSnapshot)
      expect(randomSpy).not.toHaveBeenCalled()
    } finally {
      randomSpy.mockRestore()
    }
  })

  it('records a dice result once and blocks another roll during resolution', () => {
    const state = createInitialGameState(setup)
    const rolledState = gameReducer(state, { type: 'roll-dice', dice: [2, 5] })

    expect(rolledState).toMatchObject({ dice: [2, 5], phase: 'resolving-turn' })
    expect(rolledState).not.toBe(state)
    expect(state).toMatchObject({ dice: null, phase: 'awaiting-roll' })
    expect(gameReducer(rolledState, { type: 'roll-dice', dice: [1, 1] })).toBe(rolledState)
  })

  it('moves only the active player by the stored dice total during resolution', () => {
    const state = createInitialGameState(setup)
    const rolledState = gameReducer(state, { type: 'roll-dice', dice: [2, 5] })
    const movedState = gameReducer(rolledState, { type: 'move-player' })

    expect(movedState.players.map((player) => player.position)).toEqual([7, 0])
    expect(movedState).toMatchObject({ dice: [2, 5], phase: 'awaiting-player-action' })
    expect(rolledState.players.map((player) => player.position)).toEqual([0, 0])
    expect(gameReducer(state, { type: 'move-player' })).toBe(state)
  })

  it('awards $200 only when movement passes GO', () => {
    const initialState = createInitialGameState(setup)
    const nearGoState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 39 } : player,
      ),
    }
    const rolledState = gameReducer(nearGoState, { type: 'roll-dice', dice: [1, 2] })
    const movedState = gameReducer(rolledState, { type: 'move-player' })

    expect(movedState.players[0]).toMatchObject({ position: 2, cash: 1700 })
    expect(movedState.players[1]).toMatchObject({ position: 0, cash: 1500 })
    expect(nearGoState.players[0]).toMatchObject({ position: 39, cash: 1500 })

    const noWrapState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 10 } : player,
      ),
    }
    const noWrapRoll = gameReducer(noWrapState, { type: 'roll-dice', dice: [1, 2] })
    const noWrapMove = gameReducer(noWrapRoll, { type: 'move-player' })

    expect(noWrapMove.players[0]).toMatchObject({ position: 13, cash: 1500 })
  })

  it('preserves the current state for an unknown or malformed action', () => {
    const state = createInitialGameState(setup)
    const invalidAction = { type: 'skip-turn', extra: true } as unknown as GameAction

    expect(gameReducer(state, invalidAction)).toBe(state)
  })
})
