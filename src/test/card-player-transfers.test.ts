import { describe, expect, it } from 'vitest'
import type { CardDeck } from '../game/cards'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const fourPlayerSetup = {
  playerCount: 4 as const,
  playerNames: ['Alex', 'Jordan', 'Casey', 'Morgan'],
  playerColors: ['red', 'blue', 'green', 'purple'] as const,
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

describe('per-player payment cards', () => {
  it('collects once from each opponent and identifies each payer and recipient', () => {
    const drawn = drawCard(
      createInitialGameState(fourPlayerSetup, () => 0),
      'community-chest',
      'community-chest-birthday',
    )
    const completed = gameReducer(drawn, { type: 'complete-card' })

    expect(completed.players.map(({ cash }) => cash)).toEqual([1530, 1490, 1490, 1490])
    expect(completed.log.slice(-4).map(({ event }) => event)).toEqual([
      { type: 'payment', payerId: 'player-2', payeeId: 'player-1', amount: 10, reason: 'card' },
      { type: 'payment', payerId: 'player-3', payeeId: 'player-1', amount: 10, reason: 'card' },
      { type: 'payment', payerId: 'player-4', payeeId: 'player-1', amount: 10, reason: 'card' },
      {
        type: 'card-returned',
        playerId: 'player-1',
        deck: 'community-chest',
        cardId: 'community-chest-birthday',
      },
    ])
  })

  it('pays each opponent once and excludes the acting player as a recipient', () => {
    const drawn = drawCard(
      createInitialGameState(fourPlayerSetup, () => 0),
      'chance',
      'chance-chairman',
    )
    const completed = gameReducer(drawn, { type: 'complete-card' })

    expect(completed.players.map(({ cash }) => cash)).toEqual([1350, 1550, 1550, 1550])
    expect(completed.log.slice(-4).map(({ event }) => event)).toEqual([
      { type: 'payment', payerId: 'player-1', payeeId: 'player-2', amount: 50, reason: 'card' },
      { type: 'payment', payerId: 'player-1', payeeId: 'player-3', amount: 50, reason: 'card' },
      { type: 'payment', payerId: 'player-1', payeeId: 'player-4', amount: 50, reason: 'card' },
      {
        type: 'card-returned',
        playerId: 'player-1',
        deck: 'chance',
        cardId: 'chance-chairman',
      },
    ])
  })
})
