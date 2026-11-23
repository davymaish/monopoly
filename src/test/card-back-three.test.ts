import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function completeBackThree(
  startingPosition: number,
  ownershipOverrides: Record<string, string | null> = {},
  mortgagedProperties: string[] = [],
  communityChestCardId = 'community-chest-bank-error',
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
        'chance-back-three',
        ...state.decks.chance.filter((id) => id !== 'chance-back-three'),
      ],
      communityChest: [
        communityChestCardId,
        ...state.decks.communityChest.filter((id) => id !== communityChestCardId),
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

describe('back-three Chance card', () => {
  it.each([
    { start: 7, destination: 4, resolution: 'tax', spaceId: 'income-tax' },
    { start: 22, destination: 19, resolution: 'unowned-property', spaceId: 'new-york-avenue' },
    { start: 36, destination: 33, resolution: 'card', spaceId: 'community-chest-3' },
  ])(
    'moves backward from $start to $destination and resolves $resolution',
    ({ start, destination, resolution, spaceId }) => {
      const completed = completeBackThree(start)

      expect(completed.players[0]).toMatchObject({ position: destination, cash: 1500 })
      expect(completed.landingResolution).toMatchObject({ type: resolution, spaceId })
      expect(completed.log.find(({ event }) => event.type === 'movement')?.event).toEqual({
        type: 'movement',
        playerId: 'player-1',
        from: start,
        to: destination,
        spacesMoved: -3,
      })
      expect(completed.log.at(-1)?.event).toEqual({
        type: 'card-returned',
        playerId: 'player-1',
        deck: 'chance',
        cardId: 'chance-back-three',
      })
    },
  )

  it('wraps backward around GO without awarding GO salary', () => {
    const completed = completeBackThree(1)

    expect(completed.players[0]).toMatchObject({ position: 38, cash: 1500 })
    expect(completed.landingResolution).toMatchObject({
      type: 'tax',
      spaceId: 'luxury-tax',
      tax: 'luxury',
    })
    expect(completed.log.some(({ event }) => event.type === 'income')).toBe(false)
  })

  it('charges rent when the backward destination is opponent-owned', () => {
    const completed = completeBackThree(22, { 'new-york-avenue': 'player-2' })

    expect(completed.players[0]).toMatchObject({ position: 19, cash: 1484 })
    expect(completed.players[1]?.cash).toBe(1516)
    expect(completed.landingResolution).toMatchObject({
      type: 'owned-property',
      spaceId: 'new-york-avenue',
      ownerId: 'player-2',
      legalActions: ['pay-rent'],
    })
    expect(completed.log.at(-2)?.event).toEqual({
      type: 'payment',
      payerId: 'player-1',
      payeeId: 'player-2',
      amount: 16,
      reason: 'rent',
    })
  })

  it('allows the player to draw and resolve the Community Chest reached by moving back', () => {
    const landedOnCommunityChest = completeBackThree(36)
    const drewCommunityChest = gameReducer(landedOnCommunityChest, {
      type: 'draw-card',
      deck: 'community-chest',
    })
    const completedCommunityChest = gameReducer(drewCommunityChest, { type: 'complete-card' })

    expect(landedOnCommunityChest.landingResolution).toMatchObject({
      type: 'card',
      spaceId: 'community-chest-3',
      deck: 'community-chest',
    })
    expect(completedCommunityChest.players[0]).toMatchObject({ position: 33, cash: 1700 })
    expect(completedCommunityChest.log.map(({ event }) => event)).toContainEqual({
      type: 'card-drawn',
      playerId: 'player-1',
      deck: 'community-chest',
      cardId: 'community-chest-bank-error',
    })
  })
})
