import { describe, expect, it } from 'vitest'
import { BOARD_SPACES } from '../game/board'
import { createInitialGameState, STARTING_CASH } from '../game/initial-state'

const twoPlayerSetup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

describe('createInitialGameState', () => {
  it('creates a deterministic game with players in setup order', () => {
    const first = createInitialGameState(twoPlayerSetup)
    const second = createInitialGameState(twoPlayerSetup)

    expect(first).toEqual(second)
    expect(first.currentPlayerIndex).toBe(0)
    expect(first.players.map(({ id, name, color }) => ({ id, name, color }))).toEqual([
      { id: 'player-1', name: 'Alex', color: 'red' },
      { id: 'player-2', name: 'Jordan', color: 'blue' },
    ])
  })

  it('places every player at GO with $1,500 and no property or jail-free cards', () => {
    const goPosition = BOARD_SPACES.find((space) => space.id === 'go')?.position
    const state = createInitialGameState(twoPlayerSetup)

    expect(goPosition).toBe(0)
    expect(state.players).toHaveLength(2)
    expect(
      state.players.every(
        (player) =>
          player.position === goPosition &&
          player.cash === STARTING_CASH &&
          player.ownedPropertyIds.length === 0 &&
          player.getOutOfJailFreeCardCount === 0,
      ),
    ).toBe(true)
  })

  it('supports a four-player starting state', () => {
    const state = createInitialGameState({
      playerCount: 4,
      playerNames: ['Alex', 'Jordan', 'Casey', 'Morgan'],
      playerColors: ['red', 'blue', 'green', 'purple'],
    })

    expect(state.players).toHaveLength(4)
    expect(state.players.map((player) => player.position)).toEqual([0, 0, 0, 0])
    expect(state.players.map((player) => player.cash)).toEqual([
      STARTING_CASH,
      STARTING_CASH,
      STARTING_CASH,
      STARTING_CASH,
    ])
  })

  it('refuses invalid or incomplete setup rather than creating a partial game', () => {
    expect(() =>
      createInitialGameState({
        playerCount: 2,
        playerNames: ['Alex'],
        playerColors: ['red'],
      }),
    ).toThrow('Cannot create a game from invalid setup')

    expect(() =>
      createInitialGameState({
        playerCount: 2,
        playerNames: ['Alex', 'Jordan'],
        playerColors: ['red', 'red'],
      }),
    ).toThrow('Cannot create a game from invalid setup')
  })
})
