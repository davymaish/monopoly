import { describe, expect, it } from 'vitest'
import { CHANCE_CARDS } from '../game/cards'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function withChanceLanding(state: GameState, chanceCards: string[]): GameState {
  return {
    ...state,
    decks: { ...state.decks, chance: chanceCards },
    landingResolution: {
      type: 'card',
      spaceId: 'chance',
      deck: 'chance',
      legalActions: ['draw-card'],
    },
    phase: 'awaiting-player-action',
  }
}

describe('card draw and return lifecycle', () => {
  it('draws the top card into pending state without mutating the source deck', () => {
    const originalDeck = ['chance-bank-dividend', 'chance-poor-tax']
    const state = withChanceLanding(
      createInitialGameState(setup, () => 0),
      originalDeck,
    )

    const drawn = gameReducer(state, { type: 'draw-card', deck: 'chance' })

    expect(state.decks.chance).toEqual(originalDeck)
    expect(drawn.decks.chance).toEqual(['chance-poor-tax'])
    expect(drawn.pendingCard).toEqual({
      deck: 'chance',
      cardId: 'chance-bank-dividend',
      playerId: 'player-1',
    })
    expect(drawn.landingResolution).toBeNull()
    expect(drawn.log.at(-1)?.event).toEqual({
      type: 'card-drawn',
      playerId: 'player-1',
      deck: 'chance',
      cardId: 'chance-bank-dividend',
    })
  })

  it('returns a completed card to the bottom and prevents ending a turn while it is pending', () => {
    const state = withChanceLanding(
      createInitialGameState(setup, () => 0),
      ['chance-bank-dividend', 'chance-poor-tax'],
    )
    const drawn = gameReducer(state, { type: 'draw-card', deck: 'chance' })

    expect(gameReducer(drawn, { type: 'end-turn' })).toBe(drawn)

    const completed = gameReducer(drawn, { type: 'complete-card' })

    expect(completed.decks.chance).toEqual(['chance-poor-tax', 'chance-bank-dividend'])
    expect(completed.pendingCard).toBeNull()
    expect(completed.log.at(-1)?.event).toEqual({
      type: 'card-returned',
      playerId: 'player-1',
      deck: 'chance',
      cardId: 'chance-bank-dividend',
    })
  })

  it('retains a jail-free card outside the deck and records it on the player', () => {
    const state = withChanceLanding(
      createInitialGameState(setup, () => 0),
      ['chance-jail-free', 'chance-bank-dividend'],
    )

    const drawn = gameReducer(state, { type: 'draw-card', deck: 'chance' })

    expect(drawn.decks.chance).toEqual(['chance-bank-dividend'])
    expect(drawn.players[0]?.getOutOfJailFreeCardCount).toBe(1)
    expect(drawn.heldJailFreeCards).toEqual([
      { deck: 'chance', cardId: 'chance-jail-free', playerId: 'player-1' },
    ])
    expect(drawn.pendingCard).toBeNull()
    expect(drawn.landingResolution).toBeNull()
  })

  it('preserves the order through a full cycle of cards returned to the deck bottom', () => {
    const cycleOrder = CHANCE_CARDS.filter(
      ({ effect }) => effect.type !== 'get-out-of-jail-free',
    ).map(({ id }) => id)
    let state = withChanceLanding(
      createInitialGameState(setup, () => 0),
      cycleOrder,
    )

    for (const cardId of cycleOrder) {
      state = withChanceLanding(state, state.decks.chance)
      const drawn = gameReducer(state, { type: 'draw-card', deck: 'chance' })
      expect(drawn.pendingCard?.cardId).toBe(cardId)
      state = gameReducer(drawn, { type: 'complete-card' })
    }

    expect(state.decks.chance).toEqual(cycleOrder)
    expect(state.pendingCard).toBeNull()
  })

  it('ignores mismatched deck draws and completion without a pending card', () => {
    const state = withChanceLanding(
      createInitialGameState(setup, () => 0),
      ['chance-bank-dividend'],
    )

    expect(gameReducer(state, { type: 'end-turn' })).toBe(state)
    expect(gameReducer(state, { type: 'draw-card', deck: 'community-chest' })).toBe(state)
    expect(gameReducer(state, { type: 'complete-card' })).toBe(state)
  })
})
