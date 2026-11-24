import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/initial-state'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

describe('explicit Jail status', () => {
  it('starts players outside Jail with a zero turn count', () => {
    const state = createInitialGameState(setup, () => 0)

    expect(state.players.map(({ isInJail, jailTurns }) => ({ isInJail, jailTurns }))).toEqual([
      { isInJail: false, jailTurns: 0 },
      { isInJail: false, jailTurns: 0 },
    ])
  })

  it('does not mark a player as jailed when they land on Just Visiting', () => {
    const state = createInitialGameState(setup, () => 0)
    const rolled = gameReducer(state, { type: 'roll-dice', dice: [5, 5] })
    const completed = gameReducer(rolled, { type: 'move-player' })

    expect(completed.players[0]).toMatchObject({ position: 10, isInJail: false, jailTurns: 0 })
    expect(completed.landingResolution?.type).toBe('jail-visit')
  })

  it('blocks ordinary roll and movement actions while jailed', () => {
    const initialState = createInitialGameState(setup, () => 0)
    const jailedState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 10, isInJail: true } : player,
      ),
    }
    const resolvingState = {
      ...jailedState,
      dice: [2, 3] as const,
      phase: 'resolving-turn' as const,
    }

    expect(gameReducer(jailedState, { type: 'roll-dice', dice: [1, 2] })).toBe(jailedState)
    expect(gameReducer(resolvingState, { type: 'move-player' })).toBe(resolvingState)
  })
})
