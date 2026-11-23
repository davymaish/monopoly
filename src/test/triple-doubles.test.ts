import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

describe('three-doubles Jail rule', () => {
  it('sends the player directly to Jail without moving or collecting GO salary', () => {
    const initialState = createInitialGameState(setup, () => 0)
    const state: GameState = {
      ...initialState,
      doublesCount: 2,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 39, cash: 1500 } : player,
      ),
    }
    const rolled = gameReducer(state, { type: 'roll-dice', dice: [1, 1] })
    expect(rolled).toMatchObject({ doublesCount: 3, extraRollAvailable: true })

    const completed = gameReducer(rolled, { type: 'move-player' })

    expect(completed.players[0]).toMatchObject({ position: 10, cash: 1500 })
    expect(completed).toMatchObject({
      doublesCount: 0,
      extraRollAvailable: false,
      phase: 'awaiting-player-action',
    })
    expect(completed.landingResolution?.type).toBe('jail-visit')
    expect(completed.log.map(({ event }) => event)).toEqual([
      { type: 'roll', playerId: 'player-1', dice: [1, 1] },
      { type: 'sent-to-jail', playerId: 'player-1', source: 'third-double' },
    ])
  })
})
