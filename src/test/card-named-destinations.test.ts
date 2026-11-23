import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function completeNamedCard(
  cardId: string,
  startingPosition: number,
  ownershipOverrides: Record<string, string | null> = {},
  mortgagedProperties: string[] = [],
): GameState {
  const state = createInitialGameState(setup, () => 0)
  const atCardSpace: GameState = {
    ...state,
    ownership: { ...state.ownership, ...ownershipOverrides },
    mortgagedProperties,
    players: state.players.map((player, index) =>
      index === state.currentPlayerIndex ? { ...player, position: startingPosition } : player,
    ),
    decks: {
      ...state.decks,
      chance: [cardId, ...state.decks.chance.filter((id) => id !== cardId)],
    },
    landingResolution: {
      type: 'card',
      spaceId: 'chance-space',
      deck: 'chance',
      legalActions: ['draw-card'],
    },
    phase: 'awaiting-player-action',
  }

  const drawn = gameReducer(atCardSpace, { type: 'draw-card', deck: 'chance' })
  return gameReducer(drawn, { type: 'complete-card' })
}

describe('named-destination Chance cards', () => {
  it.each([
    {
      cardId: 'chance-advance-illinois-avenue',
      start: 22,
      destination: 24,
      spaceId: 'illinois-avenue',
      collectSalary: false,
    },
    {
      cardId: 'chance-advance-illinois-avenue',
      start: 36,
      destination: 24,
      spaceId: 'illinois-avenue',
      collectSalary: true,
    },
    {
      cardId: 'chance-advance-st-charles-place',
      start: 36,
      destination: 11,
      spaceId: 'st-charles-place',
      collectSalary: true,
    },
    {
      cardId: 'chance-reading-railroad',
      start: 36,
      destination: 5,
      spaceId: 'reading-railroad',
      collectSalary: true,
    },
    {
      cardId: 'chance-boardwalk',
      start: 36,
      destination: 39,
      spaceId: 'boardwalk',
      collectSalary: false,
    },
  ])(
    '$cardId moves to its destination and applies the card-specific GO rule',
    ({ cardId, start, destination, spaceId, collectSalary }) => {
      const completed = completeNamedCard(cardId, start)
      const movement = completed.log.find(({ event }) => event.type === 'movement')?.event

      expect(completed.players[0]).toMatchObject({
        position: destination,
        cash: collectSalary ? 1700 : 1500,
      })
      expect(completed.landingResolution).toMatchObject({
        type: 'unowned-property',
        spaceId,
        legalActions: ['buy-property', 'decline-purchase'],
      })
      expect(movement).toEqual({
        type: 'movement',
        playerId: 'player-1',
        from: start,
        to: destination,
        spacesMoved: (destination - start + 40) % 40,
      })
      expect(
        completed.log.some(({ event }) => event.type === 'income' && event.reason === 'go-salary'),
      ).toBe(collectSalary)
      expect(completed.log.at(-1)?.event).toEqual({
        type: 'card-returned',
        playerId: 'player-1',
        deck: 'chance',
        cardId,
      })
    },
  )

  it('charges rent and leaves the landing resolution on an opponent-owned destination', () => {
    const completed = completeNamedCard('chance-reading-railroad', 36, {
      'reading-railroad': 'player-2',
    })

    expect(completed.players[0]).toMatchObject({ position: 5, cash: 1675 })
    expect(completed.players[1]).toMatchObject({ cash: 1525 })
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
        amount: 25,
        reason: 'rent',
      },
      {
        type: 'card-returned',
        playerId: 'player-1',
        deck: 'chance',
        cardId: 'chance-reading-railroad',
      },
    ])
  })

  it('does not charge rent on a mortgaged destination', () => {
    const completed = completeNamedCard(
      'chance-reading-railroad',
      36,
      { 'reading-railroad': 'player-2' },
      ['reading-railroad'],
    )

    expect(completed.players[0]).toMatchObject({ position: 5, cash: 1700 })
    expect(completed.players[1]?.cash).toBe(1500)
    expect(completed.landingResolution).toMatchObject({
      type: 'mortgaged-property',
      spaceId: 'reading-railroad',
    })
    expect(completed.log.at(-2)?.event).toEqual({
      type: 'rent-skipped',
      payerId: 'player-1',
      ownerId: 'player-2',
      propertyId: 'reading-railroad',
      reason: 'mortgaged',
    })
  })
})
