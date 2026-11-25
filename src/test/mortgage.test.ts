import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/initial-state'
import type { GameState, PropertyBuildingCounts } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function createState(ownershipOverrides: Record<string, string | null> = {}): GameState {
  const initialState = createInitialGameState(setup)
  const ownership = { ...initialState.ownership }
  for (const [propertyId, ownerId] of Object.entries(ownershipOverrides)) {
    ownership[propertyId] = ownerId
  }
  return { ...initialState, ownership }
}

describe('property mortgages', () => {
  it.each([
    ['mediterranean-avenue', 30],
    ['reading-railroad', 100],
    ['electric-company', 75],
  ] as const)('mortgages %s for its deed value', (propertyId, amount) => {
    const state = createState({ [propertyId]: 'player-1' })
    const mortgaged = gameReducer(state, { type: 'mortgage-property', propertyId })

    expect(mortgaged.players[0]?.cash).toBe(1500 + amount)
    expect(mortgaged.mortgagedProperties).toContain(propertyId)
    expect(mortgaged.log.at(-1)?.event).toEqual({
      type: 'income',
      playerId: 'player-1',
      amount,
      reason: 'mortgage',
    })
  })

  it.each([
    ['houses', { houses: 1, hotels: 0 }],
    ['hotels', { houses: 0, hotels: 1 }],
  ] as const)(
    'blocks a mortgage when another property in the color group has %s',
    (_buildingType, buildings: PropertyBuildingCounts) => {
      const state = createState({
        'mediterranean-avenue': 'player-1',
        'baltic-avenue': 'player-1',
      })
      const improvedGroup = {
        ...state,
        propertyBuildings: {
          ...state.propertyBuildings,
          'mediterranean-avenue': buildings,
        },
      }

      expect(
        gameReducer(improvedGroup, {
          type: 'mortgage-property',
          propertyId: 'baltic-avenue',
        }),
      ).toBe(improvedGroup)
    },
  )

  it('rejects unowned, opponent-owned, already mortgaged, and out-of-phase requests', () => {
    const unowned = createState()
    const opponentOwned = createState({ 'mediterranean-avenue': 'player-2' })
    const alreadyMortgaged = {
      ...createState({ 'mediterranean-avenue': 'player-1' }),
      mortgagedProperties: ['mediterranean-avenue'],
    }
    const wrongPhase = {
      ...createState({ 'mediterranean-avenue': 'player-1' }),
      phase: 'auction' as const,
    }
    const action = { type: 'mortgage-property' as const, propertyId: 'mediterranean-avenue' }

    expect(gameReducer(unowned, action)).toBe(unowned)
    expect(gameReducer(opponentOwned, action)).toBe(opponentOwned)
    expect(gameReducer(alreadyMortgaged, action)).toBe(alreadyMortgaged)
    expect(gameReducer(wrongPhase, action)).toBe(wrongPhase)
  })

  it.each([
    ['mediterranean-avenue', 33],
    ['reading-railroad', 110],
    ['electric-company', 83],
  ] as const)('redeems %s for principal plus 10% interest', (propertyId, amount) => {
    const state = {
      ...createState({ [propertyId]: 'player-1' }),
      mortgagedProperties: [propertyId],
    }
    const redeemed = gameReducer(state, { type: 'unmortgage-property', propertyId })

    expect(redeemed.players[0]?.cash).toBe(1500 - amount)
    expect(redeemed.mortgagedProperties).not.toContain(propertyId)
    expect(redeemed.log.at(-1)?.event).toEqual({
      type: 'payment',
      payerId: 'player-1',
      payeeId: null,
      amount,
      reason: 'unmortgage',
    })
  })

  it('rejects unowned, opponent-owned, unmortgaged, unaffordable, and out-of-phase requests', () => {
    const unowned = { ...createState(), mortgagedProperties: ['mediterranean-avenue'] }
    const opponentOwned = {
      ...createState({ 'mediterranean-avenue': 'player-2' }),
      mortgagedProperties: ['mediterranean-avenue'],
    }
    const notMortgaged = createState({ 'mediterranean-avenue': 'player-1' })
    const unaffordable = {
      ...createState({ 'electric-company': 'player-1' }),
      players: createState().players.map((player, index) =>
        index === 0 ? { ...player, cash: 82 } : player,
      ),
      mortgagedProperties: ['electric-company'],
    }
    const wrongPhase = {
      ...createState({ 'mediterranean-avenue': 'player-1' }),
      mortgagedProperties: ['mediterranean-avenue'],
      phase: 'auction' as const,
    }

    expect(
      gameReducer(unowned, {
        type: 'unmortgage-property',
        propertyId: 'mediterranean-avenue',
      }),
    ).toBe(unowned)
    expect(
      gameReducer(opponentOwned, {
        type: 'unmortgage-property',
        propertyId: 'mediterranean-avenue',
      }),
    ).toBe(opponentOwned)
    expect(
      gameReducer(notMortgaged, {
        type: 'unmortgage-property',
        propertyId: 'mediterranean-avenue',
      }),
    ).toBe(notMortgaged)
    expect(
      gameReducer(unaffordable, {
        type: 'unmortgage-property',
        propertyId: 'electric-company',
      }),
    ).toBe(unaffordable)
    expect(
      gameReducer(wrongPhase, {
        type: 'unmortgage-property',
        propertyId: 'mediterranean-avenue',
      }),
    ).toBe(wrongPhase)
  })

  it('does not charge rent when another player lands on the mortgaged street', () => {
    const state = createState({ 'vermont-avenue': 'player-1' })
    const mortgaged = gameReducer(state, {
      type: 'mortgage-property',
      propertyId: 'vermont-avenue',
    })
    const nextPlayerState: GameState = {
      ...mortgaged,
      currentPlayerIndex: 1,
      players: mortgaged.players.map((player, index) =>
        index === 1 ? { ...player, position: 4 } : player,
      ),
    }
    const rolled = gameReducer(nextPlayerState, { type: 'roll-dice', dice: [2, 2] })
    const landed = gameReducer(rolled, { type: 'move-player' })

    expect(landed.players[0]?.cash).toBe(1550)
    expect(landed.players[1]?.cash).toBe(1500)
    expect(landed.landingResolution).toMatchObject({
      type: 'mortgaged-property',
      spaceId: 'vermont-avenue',
      ownerId: 'player-1',
    })
    expect(landed.log.at(-1)?.event).toMatchObject({
      type: 'rent-skipped',
      payerId: 'player-2',
      ownerId: 'player-1',
      propertyId: 'vermont-avenue',
      reason: 'mortgaged',
    })
  })
})
