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

describe('fixed-amount cash cards', () => {
  it('collects the card amount on completion and applies it only once', () => {
    const drawn = drawCard(
      createInitialGameState(setup, () => 0),
      'chance',
      'chance-bank-dividend',
    )

    expect(drawn.players[0]?.cash).toBe(1500)
    const completed = gameReducer(drawn, { type: 'complete-card' })

    expect(completed.players[0]?.cash).toBe(1550)
    expect(completed.decks.chance.at(-1)).toBe('chance-bank-dividend')
    expect(completed.log.slice(-2).map(({ event }) => event)).toEqual([
      { type: 'income', playerId: 'player-1', amount: 50, reason: 'card' },
      {
        type: 'card-returned',
        playerId: 'player-1',
        deck: 'chance',
        cardId: 'chance-bank-dividend',
      },
    ])
    expect(gameReducer(completed, { type: 'complete-card' })).toBe(completed)
  })

  it('pays the fixed card amount to the bank and records the exact payment', () => {
    const drawn = drawCard(
      createInitialGameState(setup, () => 0),
      'community-chest',
      'community-chest-doctors-fees',
    )

    const completed = gameReducer(drawn, { type: 'complete-card' })

    expect(completed.players[0]?.cash).toBe(1450)
    expect(completed.log.slice(-2).map(({ event }) => event)).toEqual([
      {
        type: 'payment',
        payerId: 'player-1',
        payeeId: null,
        amount: 50,
        reason: 'card',
      },
      {
        type: 'card-returned',
        playerId: 'player-1',
        deck: 'community-chest',
        cardId: 'community-chest-doctors-fees',
      },
    ])
  })
})
