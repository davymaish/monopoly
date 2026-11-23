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

function completeGoCard(deck: CardDeck, cardId: string, startingPosition: number): GameState {
  const state = createInitialGameState(setup, () => 0)
  const deckKey = deck === 'chance' ? 'chance' : 'communityChest'
  const atCardSpace: GameState = {
    ...state,
    players: state.players.map((player, index) =>
      index === state.currentPlayerIndex ? { ...player, position: startingPosition } : player,
    ),
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

  const drawn = gameReducer(atCardSpace, { type: 'draw-card', deck })
  return gameReducer(drawn, { type: 'complete-card' })
}

describe('Advance to GO cards', () => {
  it.each([
    { deck: 'chance' as const, cardId: 'chance-advance-go', start: 36, spacesMoved: 4 },
    {
      deck: 'community-chest' as const,
      cardId: 'community-chest-advance-go',
      start: 33,
      spacesMoved: 7,
    },
  ])(
    'moves from $deck to GO and awards the card salary exactly once',
    ({ deck, cardId, start, spacesMoved }) => {
      const completed = completeGoCard(deck, cardId, start)

      expect(completed.players[0]).toMatchObject({ position: 0, cash: 1700 })
      expect(completed.players[1]).toMatchObject({ position: 0, cash: 1500 })
      expect(completed.landingResolution).toEqual({
        type: 'go',
        spaceId: 'go',
        legalActions: ['continue'],
      })
      expect(completed.log.slice(-3).map(({ event }) => event)).toEqual([
        {
          type: 'movement',
          playerId: 'player-1',
          from: start,
          to: 0,
          spacesMoved,
        },
        { type: 'income', playerId: 'player-1', amount: 200, reason: 'go-salary' },
        { type: 'card-returned', playerId: 'player-1', deck, cardId },
      ])
    },
  )

  it('does not award the salary more than once after the card is completed', () => {
    const completed = completeGoCard('chance', 'chance-advance-go', 36)

    expect(gameReducer(completed, { type: 'complete-card' })).toBe(completed)
    expect(completed.players[0]?.cash).toBe(1700)
  })
})
