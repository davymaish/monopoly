import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function createBrownState(mediterraneanHouses: number, balticHouses: number): GameState {
  const initialState = createInitialGameState(setup)
  return {
    ...initialState,
    ownership: {
      ...initialState.ownership,
      'mediterranean-avenue': 'player-1',
      'baltic-avenue': 'player-1',
    },
    propertyBuildings: {
      ...initialState.propertyBuildings,
      'mediterranean-avenue': { houses: mediterraneanHouses, hotels: 0 },
      'baltic-avenue': { houses: balticHouses, hotels: 0 },
    },
  }
}

function createHotelSaleState(redGroupHouses: number): GameState {
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
    {
      ids: ['kentucky-avenue', 'indiana-avenue', 'illinois-avenue'],
      houses: [redGroupHouses, redGroupHouses, redGroupHouses],
    },
  ]

  for (const group of groups) {
    for (const [index, id] of group.ids.entries()) {
      ownership[id] = 'player-2'
      propertyBuildings[id] = { houses: group.houses[index] ?? 0, hotels: 0 }
    }
  }
  ownership['mediterranean-avenue'] = 'player-1'
  ownership['baltic-avenue'] = 'player-1'
  propertyBuildings['mediterranean-avenue'] = { houses: 0, hotels: 1 }
  propertyBuildings['baltic-avenue'] = { houses: 4, hotels: 0 }

  return { ...initialState, ownership, propertyBuildings }
}

function countHouses(state: GameState): number {
  return Object.values(state.propertyBuildings).reduce(
    (total, buildings) => total + buildings.houses,
    0,
  )
}

describe('building sales', () => {
  it('sells a house from the most-developed property for half cost', () => {
    const state = createBrownState(4, 3)
    const sold = gameReducer(state, { type: 'sell-building', propertyId: 'mediterranean-avenue' })

    expect(sold.players[0]?.cash).toBe(1525)
    expect(sold.propertyBuildings['mediterranean-avenue']).toEqual({ houses: 3, hotels: 0 })
    expect(sold.propertyBuildings['baltic-avenue']).toEqual({ houses: 3, hotels: 0 })
    expect(sold.log.at(-1)?.event).toEqual({
      type: 'income',
      playerId: 'player-1',
      amount: 25,
      reason: 'building-sale',
    })
    expect(countHouses(sold)).toBe(countHouses(state) - 1)
  })

  it('rejects selling from a less-developed property when that would break even-selling', () => {
    const state = createBrownState(3, 4)

    expect(gameReducer(state, { type: 'sell-building', propertyId: 'mediterranean-avenue' })).toBe(
      state,
    )
  })

  it('sells a hotel for half cost and replaces it with four houses when supply allows', () => {
    const state = createHotelSaleState(0)
    const sold = gameReducer(state, { type: 'sell-building', propertyId: 'mediterranean-avenue' })

    expect(countHouses(state)).toBe(28)
    expect(countHouses(sold)).toBe(32)
    expect(sold.propertyBuildings['mediterranean-avenue']).toEqual({ houses: 4, hotels: 0 })
    expect(sold.propertyBuildings['baltic-avenue']).toEqual({ houses: 4, hotels: 0 })
    expect(sold.players[0]?.cash).toBe(1525)
  })

  it('rejects hotel sale when four replacement houses are not available', () => {
    const state = createHotelSaleState(1)

    expect(countHouses(state)).toBe(31)
    expect(gameReducer(state, { type: 'sell-building', propertyId: 'mediterranean-avenue' })).toBe(
      state,
    )
  })
})
