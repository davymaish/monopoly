import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'
import { calculateStreetRent } from '../game/rent'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function createReadyHotelState(): GameState {
  const initialState = createInitialGameState(setup)
  const ownership = { ...initialState.ownership }
  const propertyBuildings = { ...initialState.propertyBuildings }
  const groups: { ids: string[]; houses: readonly number[] }[] = [
    {
      ids: ['oriental-avenue', 'vermont-avenue', 'connecticut-avenue'],
      houses: [4, 4, 4],
    },
    {
      ids: ['st-charles-place', 'states-avenue', 'virginia-avenue'],
      houses: [4, 4, 4],
    },
  ]

  for (const group of groups) {
    for (const [index, id] of group.ids.entries()) {
      ownership[id] = 'player-2'
      propertyBuildings[id] = { houses: group.houses[index] ?? 0, hotels: 0 }
    }
  }
  for (const id of ['mediterranean-avenue', 'baltic-avenue']) {
    ownership[id] = 'player-1'
    propertyBuildings[id] = { houses: 4, hotels: 0 }
  }

  return { ...initialState, ownership, propertyBuildings }
}

describe('hotel upgrade', () => {
  it('replaces four houses, charges one house cost, and applies hotel rent', () => {
    const state = createReadyHotelState()
    const upgraded = gameReducer(state, {
      type: 'build-hotel',
      propertyId: 'mediterranean-avenue',
    })

    expect(upgraded.players[0]?.cash).toBe(1450)
    expect(upgraded.propertyBuildings['mediterranean-avenue']).toEqual({ houses: 0, hotels: 1 })
    expect(upgraded.propertyBuildings['baltic-avenue']).toEqual({ houses: 4, hotels: 0 })
    expect(
      Object.values(state.propertyBuildings).reduce(
        (total, buildings) => total + buildings.houses,
        0,
      ),
    ).toBe(32)
    expect(
      Object.values(upgraded.propertyBuildings).reduce(
        (total, buildings) => total + buildings.houses,
        0,
      ),
    ).toBe(28)
    expect(
      calculateStreetRent('mediterranean-avenue', upgraded.ownership, upgraded.propertyBuildings),
    ).toBe(250)
    expect(upgraded.log.at(-1)?.event).toEqual({
      type: 'payment',
      payerId: 'player-1',
      payeeId: null,
      amount: 50,
      reason: 'hotel-purchase',
    })
  })

  it('rejects upgrades before four houses or when the hotel bank is exhausted', () => {
    const unfinished = createReadyHotelState()
    unfinished.propertyBuildings['baltic-avenue'] = { houses: 3, hotels: 0 }
    expect(
      gameReducer(unfinished, { type: 'build-hotel', propertyId: 'mediterranean-avenue' }),
    ).toBe(unfinished)

    const hotelSupplyExhausted = createReadyHotelState()
    const ownership = { ...hotelSupplyExhausted.ownership }
    const propertyBuildings = { ...hotelSupplyExhausted.propertyBuildings }
    const hotelPropertyIds = [
      'oriental-avenue',
      'vermont-avenue',
      'connecticut-avenue',
      'st-charles-place',
      'states-avenue',
      'virginia-avenue',
      'st-james-place',
      'tennessee-avenue',
      'new-york-avenue',
      'kentucky-avenue',
      'indiana-avenue',
      'illinois-avenue',
    ]
    for (const id of hotelPropertyIds) {
      ownership[id] = 'player-2'
      propertyBuildings[id] = { houses: 0, hotels: 1 }
    }
    const exhaustedState = { ...hotelSupplyExhausted, ownership, propertyBuildings }

    expect(
      gameReducer(exhaustedState, { type: 'build-hotel', propertyId: 'mediterranean-avenue' }),
    ).toBe(exhaustedState)
  })
})
