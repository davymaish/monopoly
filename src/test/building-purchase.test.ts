import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function createBrownGroupState(): GameState {
  const initialState = createInitialGameState(setup)
  return {
    ...initialState,
    ownership: {
      ...initialState.ownership,
      'mediterranean-avenue': 'player-1',
      'baltic-avenue': 'player-1',
    },
  }
}

describe('house purchase', () => {
  it('deducts the house cost, adds one house, and logs payment', () => {
    const state = createBrownGroupState()
    const updated = gameReducer(state, { type: 'build-house', propertyId: 'baltic-avenue' })

    expect(updated.players[0]?.cash).toBe(1450)
    expect(updated.propertyBuildings['baltic-avenue']).toEqual({ houses: 1, hotels: 0 })
    expect(updated.log.at(-1)?.event).toEqual({
      type: 'payment',
      payerId: 'player-1',
      payeeId: null,
      amount: 50,
      reason: 'house-purchase',
    })
    expect(state.players[0]?.cash).toBe(1500)
    expect(state.propertyBuildings['baltic-avenue']).toEqual({ houses: 0, hotels: 0 })
  })

  it('rejects an incomplete group and a property the current player does not own', () => {
    const incompleteGroup = createBrownGroupState()
    incompleteGroup.ownership['baltic-avenue'] = null
    expect(
      gameReducer(incompleteGroup, { type: 'build-house', propertyId: 'mediterranean-avenue' }),
    ).toBe(incompleteGroup)

    const otherOwner = createBrownGroupState()
    expect(gameReducer(otherOwner, { type: 'build-house', propertyId: 'oriental-avenue' })).toBe(
      otherOwner,
    )
  })

  it('rejects unaffordable or uneven construction and the per-property house limit', () => {
    const unaffordable = createBrownGroupState()
    unaffordable.players[0] = { ...unaffordable.players[0]!, cash: 49 }
    expect(
      gameReducer(unaffordable, { type: 'build-house', propertyId: 'mediterranean-avenue' }),
    ).toBe(unaffordable)

    const uneven = createBrownGroupState()
    uneven.propertyBuildings['mediterranean-avenue'] = { houses: 1, hotels: 0 }
    expect(gameReducer(uneven, { type: 'build-house', propertyId: 'mediterranean-avenue' })).toBe(
      uneven,
    )

    const maxed = createBrownGroupState()
    maxed.propertyBuildings['baltic-avenue'] = { houses: 4, hotels: 0 }
    expect(gameReducer(maxed, { type: 'build-house', propertyId: 'baltic-avenue' })).toBe(maxed)
  })

  it('rejects construction outside a player-action or roll phase and on a hotel', () => {
    const wrongPhase = createBrownGroupState()
    wrongPhase.phase = 'resolving-turn'
    expect(
      gameReducer(wrongPhase, { type: 'build-house', propertyId: 'mediterranean-avenue' }),
    ).toBe(wrongPhase)

    const hotel = createBrownGroupState()
    hotel.propertyBuildings['baltic-avenue'] = { houses: 0, hotels: 1 }
    expect(gameReducer(hotel, { type: 'build-house', propertyId: 'baltic-avenue' })).toBe(hotel)
  })
})

describe('building rent in reducer movement', () => {
  it('charges the scheduled house rent after an ordinary roll', () => {
    const initialState = createInitialGameState(setup)
    const state = {
      ...initialState,
      ownership: { ...initialState.ownership, 'vermont-avenue': 'player-2' },
      propertyBuildings: {
        ...initialState.propertyBuildings,
        'vermont-avenue': { houses: 1, hotels: 0 },
      },
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 4 } : player,
      ),
    }
    const rolled = gameReducer(state, { type: 'roll-dice', dice: [2, 2] })
    const moved = gameReducer(rolled, { type: 'move-player' })

    expect(moved.players.map(({ cash }) => cash)).toEqual([1470, 1530])
    expect(moved.log.at(-1)?.event).toMatchObject({ type: 'payment', amount: 30, reason: 'rent' })
  })

  it('charges the scheduled house rent after a back-three Chance movement', () => {
    const initialState = createInitialGameState(setup)
    const state = {
      ...initialState,
      phase: 'awaiting-player-action' as const,
      pendingCard: { deck: 'chance' as const, cardId: 'chance-back-three', playerId: 'player-1' },
      decks: {
        ...initialState.decks,
        chance: initialState.decks.chance.filter((cardId) => cardId !== 'chance-back-three'),
      },
      ownership: { ...initialState.ownership, 'new-york-avenue': 'player-2' },
      propertyBuildings: {
        ...initialState.propertyBuildings,
        'new-york-avenue': { houses: 2, hotels: 0 },
      },
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 22 } : player,
      ),
    }
    const moved = gameReducer(state, { type: 'complete-card' })

    expect(moved.players[0]).toMatchObject({ position: 19, cash: 1280 })
    expect(moved.players[1]?.cash).toBe(1720)
    expect(moved.log.map(({ event }) => event)).toContainEqual({
      type: 'payment',
      payerId: 'player-1',
      payeeId: 'player-2',
      amount: 220,
      reason: 'rent',
    })
  })
})
