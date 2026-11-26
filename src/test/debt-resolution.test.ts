import { describe, expect, it } from 'vitest'
import type { CardDeck } from '../game/cards'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function createRentDebtState(): GameState {
  const initialState = createInitialGameState(setup)
  const state: GameState = {
    ...initialState,
    ownership: {
      ...initialState.ownership,
      'vermont-avenue': 'player-2',
      'mediterranean-avenue': 'player-1',
    },
    players: initialState.players.map((player, index) =>
      index === 0 ? { ...player, position: 4, cash: 5 } : player,
    ),
  }
  return gameReducer(gameReducer(state, { type: 'roll-dice', dice: [2, 2] }), {
    type: 'move-player',
  })
}

function drawCard(state: GameState, deck: CardDeck, cardId: string): GameState {
  const deckKey = deck === 'chance' ? 'chance' : 'communityChest'
  const landingState: GameState = {
    ...state,
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

describe('debt resolution', () => {
  it('pauses unaffordable rent without negative cash and resumes after a mortgage remedy', () => {
    const state = createRentDebtState()

    expect(state.players.map(({ cash }) => cash)).toEqual([5, 1500])
    expect(state.debtResolution).toMatchObject({
      debtorId: 'player-1',
      creditorId: 'player-2',
      amount: 6,
      reason: 'rent',
    })
    expect(state.log.some(({ event }) => event.type === 'payment' && event.reason === 'rent')).toBe(
      false,
    )
    expect(gameReducer(state, { type: 'end-turn' })).toBe(state)
    expect(gameReducer(state, { type: 'roll-dice', dice: [1, 1] })).toBe(state)
    expect(gameReducer(state, { type: 'build-house', propertyId: 'mediterranean-avenue' })).toBe(
      state,
    )

    const mortgaged = gameReducer(state, {
      type: 'mortgage-property',
      propertyId: 'mediterranean-avenue',
    })
    expect(mortgaged.players[0]?.cash).toBe(35)
    expect(mortgaged.debtResolution).toEqual(state.debtResolution)

    const paid = gameReducer(mortgaged, { type: 'pay-debt' })
    expect(paid.players.map(({ cash }) => cash)).toEqual([29, 1506])
    expect(paid.debtResolution).toBeNull()
    expect(paid.log.at(-1)?.event).toEqual({
      type: 'payment',
      payerId: 'player-1',
      payeeId: 'player-2',
      amount: 6,
      reason: 'rent',
    })
  })

  it('retains the tax obligation until legal mortgages make it payable', () => {
    const initialState = createInitialGameState(setup)
    const nearLuxuryTax: GameState = {
      ...initialState,
      ownership: {
        ...initialState.ownership,
        'mediterranean-avenue': 'player-1',
        'baltic-avenue': 'player-1',
      },
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 36, cash: 40 } : player,
      ),
    }
    const landed = gameReducer(gameReducer(nearLuxuryTax, { type: 'roll-dice', dice: [1, 1] }), {
      type: 'move-player',
    })
    const indebted = gameReducer(landed, { type: 'pay-tax', choice: 'fixed' })

    expect(indebted.players[0]?.cash).toBe(40)
    expect(indebted.debtResolution).toMatchObject({
      debtorId: 'player-1',
      amount: 100,
      reason: 'tax',
    })
    expect(indebted.landingResolution).toMatchObject({ type: 'tax', tax: 'luxury' })
    expect(gameReducer(indebted, { type: 'end-turn' })).toBe(indebted)

    const firstMortgage = gameReducer(indebted, {
      type: 'mortgage-property',
      propertyId: 'mediterranean-avenue',
    })
    expect(firstMortgage.players[0]?.cash).toBe(70)
    expect(gameReducer(firstMortgage, { type: 'pay-debt' })).toBe(firstMortgage)
    const secondMortgage = gameReducer(firstMortgage, {
      type: 'mortgage-property',
      propertyId: 'baltic-avenue',
    })
    const paid = gameReducer(secondMortgage, { type: 'pay-debt' })

    expect(paid.players[0]?.cash).toBe(0)
    expect(paid.debtResolution).toBeNull()
    expect(paid.landingResolution).toBeNull()
    expect(paid.log.at(-1)?.event).toEqual({
      type: 'payment',
      payerId: 'player-1',
      payeeId: null,
      amount: 100,
      reason: 'tax',
    })
  })

  it('creates bank debt for an unaffordable cash card and does not apply it twice', () => {
    const initialState = createInitialGameState(setup)
    const poorPlayer: GameState = {
      ...initialState,
      ownership: {
        ...initialState.ownership,
        'mediterranean-avenue': 'player-1',
        'baltic-avenue': 'player-1',
      },
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, cash: 40 } : player,
      ),
    }
    const drawn = drawCard(poorPlayer, 'community-chest', 'community-chest-hospital-fees')
    const indebted = gameReducer(drawn, { type: 'complete-card' })

    expect(indebted.players[0]?.cash).toBe(40)
    expect(indebted.debtResolution).toMatchObject({
      debtorId: 'player-1',
      creditorId: null,
      amount: 100,
      reason: 'card',
    })
    expect(indebted.pendingCard).toBeNull()
    expect(indebted.log.filter(({ event }) => event.type === 'payment')).toHaveLength(0)
    expect(gameReducer(indebted, { type: 'complete-card' })).toBe(indebted)

    const firstMortgage = gameReducer(indebted, {
      type: 'mortgage-property',
      propertyId: 'mediterranean-avenue',
    })
    const secondMortgage = gameReducer(firstMortgage, {
      type: 'mortgage-property',
      propertyId: 'baltic-avenue',
    })
    const paid = gameReducer(secondMortgage, { type: 'pay-debt' })

    expect(paid.players[0]?.cash).toBe(0)
    expect(paid.debtResolution).toBeNull()
    expect(paid.log.at(-1)?.event).toEqual({
      type: 'payment',
      payerId: 'player-1',
      payeeId: null,
      amount: 100,
      reason: 'card',
    })
  })

  it('processes queued card payments in order and opens debt for the actual debtor', () => {
    const fourPlayerState = createInitialGameState({
      playerCount: 4,
      playerNames: ['Alex', 'Jordan', 'Casey', 'Morgan'],
      playerColors: ['red', 'blue', 'green', 'purple'],
    })
    const holdings: GameState = {
      ...fourPlayerState,
      ownership: { ...fourPlayerState.ownership, 'reading-railroad': 'player-2' },
      players: fourPlayerState.players.map((player, index) =>
        index === 1 ? { ...player, cash: 5 } : player,
      ),
    }
    const drawn = drawCard(holdings, 'community-chest', 'community-chest-birthday')
    const indebted = gameReducer(drawn, { type: 'complete-card' })

    expect(indebted.players.map(({ cash }) => cash)).toEqual([1500, 5, 1500, 1500])
    expect(indebted.debtResolution).toMatchObject({
      debtorId: 'player-2',
      creditorId: 'player-1',
      amount: 10,
      reason: 'card',
    })
    expect(indebted.debtResolution?.remainingPayments).toEqual([
      { debtorId: 'player-3', creditorId: 'player-1', amount: 10, reason: 'card' },
      { debtorId: 'player-4', creditorId: 'player-1', amount: 10, reason: 'card' },
    ])
    expect(gameReducer(indebted, { type: 'end-turn' })).toBe(indebted)

    const mortgaged = gameReducer(indebted, {
      type: 'mortgage-property',
      propertyId: 'reading-railroad',
    })
    const paid = gameReducer(mortgaged, { type: 'pay-debt' })

    expect(paid.debtResolution).toBeNull()
    expect(paid.players.map(({ cash }) => cash)).toEqual([1530, 95, 1490, 1490])
    expect(paid.log.slice(-3).map(({ event }) => event)).toEqual([
      { type: 'payment', payerId: 'player-2', payeeId: 'player-1', amount: 10, reason: 'card' },
      { type: 'payment', payerId: 'player-3', payeeId: 'player-1', amount: 10, reason: 'card' },
      { type: 'payment', payerId: 'player-4', payeeId: 'player-1', amount: 10, reason: 'card' },
    ])
  })
})
