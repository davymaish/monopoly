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
      { type: 'roll-dice' },
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

  it('preserves the current state for an unknown or malformed action', () => {
    const state = createInitialGameState(setup)
    const invalidAction = { type: 'skip-turn', extra: true } as unknown as GameAction

    expect(gameReducer(state, invalidAction)).toBe(state)
  })
})
