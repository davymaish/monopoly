import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function completeNearestRailroad(
  startingPosition: number,
  ownershipOverrides: Record<string, string | null> = {},
  mortgagedProperties: string[] = [],
): GameState {
  const state = createInitialGameState(setup, () => 0)
  const atChanceSpace: GameState = {
    ...state,
    ownership: { ...state.ownership, ...ownershipOverrides },
    mortgagedProperties,
    players: state.players.map((player, index) =>
      index === state.currentPlayerIndex ? { ...player, position: startingPosition } : player,
    ),
    decks: {
      ...state.decks,
      chance: [
        'chance-nearest-railroad-double-rent',
        ...state.decks.chance.filter((id) => id !== 'chance-nearest-railroad-double-rent'),
      ],
    },
    landingResolution: {
      type: 'card',
      spaceId: 'chance-space',
      deck: 'chance',
      legalActions: ['draw-card'],
    },
    phase: 'awaiting-player-action',
  }

  const drawn = gameReducer(atChanceSpace, { type: 'draw-card', deck: 'chance' })
  return gameReducer(drawn, { type: 'complete-card' })
}

describe('nearest-railroad Chance card', () => {
  it.each([
    {
      start: 7,
      destination: 15,
      spaceId: 'pennsylvania-railroad',
      spacesMoved: 8,
      collectSalary: false,
    },
    {
      start: 22,
      destination: 25,
      spaceId: 'b-and-o-railroad',
      spacesMoved: 3,
      collectSalary: false,
    },
    {
      start: 36,
      destination: 5,
      spaceId: 'reading-railroad',
      spacesMoved: 9,
      collectSalary: true,
    },
  ])(
    'moves clockwise from $start to $spaceId and applies the GO rule',
    ({ start, destination, spaceId, spacesMoved, collectSalary }) => {
      const completed = completeNearestRailroad(start)

      expect(completed.players[0]).toMatchObject({
        position: destination,
        cash: collectSalary ? 1700 : 1500,
      })
      expect(completed.landingResolution).toMatchObject({
        type: 'unowned-property',
        spaceId,
        legalActions: ['buy-property', 'decline-purchase'],
      })
      expect(completed.log.find(({ event }) => event.type === 'movement')?.event).toEqual({
        type: 'movement',
        playerId: 'player-1',
        from: start,
        to: destination,
        spacesMoved,
      })
      expect(
        completed.log.some(({ event }) => event.type === 'income' && event.reason === 'go-salary'),
      ).toBe(collectSalary)
    },
  )

  it('charges twice the normal railroad rent based on all railroads held by the owner', () => {
    const completed = completeNearestRailroad(36, {
      'reading-railroad': 'player-2',
      'pennsylvania-railroad': 'player-2',
    })

    expect(completed.players[0]).toMatchObject({ position: 5, cash: 1600 })
    expect(completed.players[1]?.cash).toBe(1600)
    expect(completed.landingResolution).toMatchObject({
      type: 'owned-property',
      spaceId: 'reading-railroad',
      ownerId: 'player-2',
      legalActions: ['pay-rent'],
    })
    expect(completed.log.slice(-3).map(({ event }) => event)).toEqual([
      { type: 'income', playerId: 'player-1', amount: 200, reason: 'go-salary' },
      {
        type: 'payment',
        payerId: 'player-1',
        payeeId: 'player-2',
        amount: 100,
        reason: 'rent',
      },
      {
        type: 'card-returned',
        playerId: 'player-1',
        deck: 'chance',
        cardId: 'chance-nearest-railroad-double-rent',
      },
    ])
  })

  it('does not charge rent on a mortgaged nearest railroad', () => {
    const completed = completeNearestRailroad(36, { 'reading-railroad': 'player-2' }, [
      'reading-railroad',
    ])

    expect(completed.players[0]).toMatchObject({ position: 5, cash: 1700 })
    expect(completed.players[1]?.cash).toBe(1500)
    expect(completed.log.some(({ event }) => event.type === 'rent-skipped')).toBe(true)
  })
})
