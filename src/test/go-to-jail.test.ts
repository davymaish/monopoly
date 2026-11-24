import { describe, expect, it } from 'vitest'
import type { CardDeck } from '../game/cards'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function drawCard(state: GameState, deck: CardDeck, cardId: string): GameState {
  const deckKey = deck === 'chance' ? 'chance' : 'communityChest'
  const landingState: GameState = {
    ...state,
    decks: {
      ...state.decks,
      [deckKey]: [cardId, ...state.decks[deckKey].filter((id) => id !== cardId)],
    },
    landingResolution: {
      type: 'card',
      spaceId: `${deck}-space`,
      deck,
      legalActions: ['draw-card'],
    },
    phase: 'awaiting-player-action',
  }

  return gameReducer(landingState, { type: 'draw-card', deck })
}

describe('Go to Jail transitions', () => {
  it('sends a player landing on the board space to Jail without GO salary', () => {
    const initialState = createInitialGameState(setup, () => 0)
    const state = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 28, cash: 1300 } : player,
      ),
    }
    const rolled = gameReducer(state, { type: 'roll-dice', dice: [1, 1] })
    const completed = gameReducer(rolled, { type: 'move-player' })

    expect(completed.players[0]).toMatchObject({
      position: 10,
      cash: 1300,
      isInJail: true,
      jailTurns: 0,
    })
    expect(completed).toMatchObject({ doublesCount: 0, extraRollAvailable: false })
    expect(completed.landingResolution?.type).toBe('jail-visit')
    expect(completed.log.slice(-2).map(({ event }) => event)).toEqual([
      { type: 'movement', playerId: 'player-1', from: 28, to: 30, spacesMoved: 2 },
      { type: 'sent-to-jail', playerId: 'player-1', source: 'board' },
    ])
  })

  it.each([
    { deck: 'chance', cardId: 'chance-go-to-jail' },
    { deck: 'community-chest', cardId: 'community-chest-go-to-jail' },
  ] as const)(
    'sends a player holding $cardId directly to Jail without salary',
    ({ deck, cardId }) => {
      const initialState = createInitialGameState(setup, () => 0)
      const state: GameState = {
        ...initialState,
        doublesCount: 1,
        extraRollAvailable: true,
        players: initialState.players.map((player, index) =>
          index === 0 ? { ...player, position: 36, cash: 1300 } : player,
        ),
      }
      const drawn = drawCard(state, deck, cardId)
      const completed = gameReducer(drawn, { type: 'complete-card' })

      expect(completed.players[0]).toMatchObject({
        position: 10,
        cash: 1300,
        isInJail: true,
        jailTurns: 0,
      })
      expect(completed).toMatchObject({ doublesCount: 0, extraRollAvailable: false })
      expect(completed.landingResolution?.type).toBe('jail-visit')
      expect(completed.log.slice(-2).map(({ event }) => event)).toEqual([
        { type: 'sent-to-jail', playerId: 'player-1', source: 'card' },
        { type: 'card-returned', playerId: 'player-1', deck, cardId },
      ])
      expect(completed.decks[deck === 'chance' ? 'chance' : 'communityChest'].at(-1)).toBe(cardId)
      expect(gameReducer(completed, { type: 'complete-card' })).toBe(completed)
    },
  )
})
