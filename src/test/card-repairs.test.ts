import { describe, expect, it } from 'vitest'
import type { CardDeck } from '../game/cards'
import { createInitialGameState } from '../game/initial-state'
import type { GameState, PropertyBuildingCounts } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

interface PropertyHolding extends PropertyBuildingCounts {
  propertyId: string
  ownerId: 'player-1' | 'player-2'
}

function drawCardWithBuildings(
  deck: CardDeck,
  cardId: string,
  holdings: readonly PropertyHolding[],
): GameState {
  const state = createInitialGameState(setup, () => 0)
  const deckKey = deck === 'chance' ? 'chance' : 'communityChest'
  const ownership = { ...state.ownership }
  const propertyBuildings = { ...state.propertyBuildings }

  for (const holding of holdings) {
    ownership[holding.propertyId] = holding.ownerId
    propertyBuildings[holding.propertyId] = {
      houses: holding.houses,
      hotels: holding.hotels,
    }
  }

  const landingState: GameState = {
    ...state,
    ownership,
    propertyBuildings,
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

describe('property repair cards', () => {
  it('charges $25 per house and $100 per hotel on the cardholder’s streets', () => {
    const drawn = drawCardWithBuildings('chance', 'chance-general-repairs', [
      { propertyId: 'mediterranean-avenue', ownerId: 'player-1', houses: 2, hotels: 0 },
      { propertyId: 'baltic-avenue', ownerId: 'player-1', houses: 0, hotels: 1 },
      { propertyId: 'connecticut-avenue', ownerId: 'player-2', houses: 4, hotels: 1 },
    ])

    const completed = gameReducer(drawn, { type: 'complete-card' })

    expect(completed.players.map(({ cash }) => cash)).toEqual([1350, 1500])
    expect(completed.log.slice(-2).map(({ event }) => event)).toEqual([
      {
        type: 'payment',
        payerId: 'player-1',
        payeeId: null,
        amount: 150,
        reason: 'card',
      },
      {
        type: 'card-returned',
        playerId: 'player-1',
        deck: 'chance',
        cardId: 'chance-general-repairs',
      },
    ])
  })

  it('charges $40 per house and $115 per hotel on the cardholder’s streets', () => {
    const drawn = drawCardWithBuildings('community-chest', 'community-chest-street-repairs', [
      { propertyId: 'mediterranean-avenue', ownerId: 'player-1', houses: 1, hotels: 0 },
      { propertyId: 'baltic-avenue', ownerId: 'player-1', houses: 0, hotels: 1 },
      { propertyId: 'vermont-avenue', ownerId: 'player-2', houses: 3, hotels: 1 },
    ])

    const completed = gameReducer(drawn, { type: 'complete-card' })

    expect(completed.players.map(({ cash }) => cash)).toEqual([1345, 1500])
    expect(completed.log.slice(-2).map(({ event }) => event)).toEqual([
      {
        type: 'payment',
        payerId: 'player-1',
        payeeId: null,
        amount: 155,
        reason: 'card',
      },
      {
        type: 'card-returned',
        playerId: 'player-1',
        deck: 'community-chest',
        cardId: 'community-chest-street-repairs',
      },
    ])
  })

  it('does not record a repair payment when the cardholder has no buildings', () => {
    const drawn = drawCardWithBuildings('chance', 'chance-general-repairs', [])
    const completed = gameReducer(drawn, { type: 'complete-card' })

    expect(completed.players[0]?.cash).toBe(1500)
    expect(completed.log.at(-1)?.event).toEqual({
      type: 'card-returned',
      playerId: 'player-1',
      deck: 'chance',
      cardId: 'chance-general-repairs',
    })
    expect(completed.log.some(({ event }) => event.type === 'payment')).toBe(false)
  })
})
