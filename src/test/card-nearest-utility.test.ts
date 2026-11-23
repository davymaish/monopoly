import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function completeNearestUtility(
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
    dice: [2, 3],
    decks: {
      ...state.decks,
      chance: [
        'chance-nearest-utility',
        ...state.decks.chance.filter((id) => id !== 'chance-nearest-utility'),
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

describe('nearest-utility Chance card', () => {
  it.each([
    {
      start: 7,
      destination: 12,
      spaceId: 'electric-company',
      spacesMoved: 5,
      collectSalary: false,
    },
    {
      start: 22,
      destination: 28,
      spaceId: 'water-works',
      spacesMoved: 6,
      collectSalary: false,
    },
    {
      start: 36,
      destination: 12,
      spaceId: 'electric-company',
      spacesMoved: 16,
      collectSalary: true,
    },
  ])(
    'moves clockwise from $start to $spaceId and applies the GO rule',
    ({ start, destination, spaceId, spacesMoved, collectSalary }) => {
      const completed = completeNearestUtility(start)

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

  it('charges ten times the dice total when the nearest utility is owned', () => {
    const completed = completeNearestUtility(36, {
      'electric-company': 'player-2',
      'water-works': 'player-2',
    })

    expect(completed.players[0]).toMatchObject({ position: 12, cash: 1650 })
    expect(completed.players[1]?.cash).toBe(1550)
    expect(completed.landingResolution).toMatchObject({
      type: 'owned-property',
      spaceId: 'electric-company',
      ownerId: 'player-2',
      legalActions: ['pay-rent'],
    })
    expect(completed.log.slice(-3).map(({ event }) => event)).toEqual([
      { type: 'income', playerId: 'player-1', amount: 200, reason: 'go-salary' },
      {
        type: 'payment',
        payerId: 'player-1',
        payeeId: 'player-2',
        amount: 50,
        reason: 'rent',
      },
      {
        type: 'card-returned',
        playerId: 'player-1',
        deck: 'chance',
        cardId: 'chance-nearest-utility',
      },
    ])
  })

  it('does not charge rent on a mortgaged nearest utility', () => {
    const completed = completeNearestUtility(36, { 'electric-company': 'player-2' }, [
      'electric-company',
    ])

    expect(completed.players[0]).toMatchObject({ position: 12, cash: 1700 })
    expect(completed.players[1]?.cash).toBe(1500)
    expect(completed.log.some(({ event }) => event.type === 'rent-skipped')).toBe(true)
  })
})
