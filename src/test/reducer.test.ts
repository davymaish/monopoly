import { describe, expect, it, vi } from 'vitest'
import type { GameAction } from '../game/actions'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function createVermontPurchaseState(cash = 1500) {
  const initialState = createInitialGameState(setup)
  const nearPropertyState = {
    ...initialState,
    players: initialState.players.map((player, index) =>
      index === 0 ? { ...player, position: 4, cash } : player,
    ),
  }
  const rolledState = gameReducer(nearPropertyState, { type: 'roll-dice', dice: [2, 2] })
  return gameReducer(rolledState, { type: 'move-player' })
}

function createVermontLandingState(
  ownershipOverrides: Record<string, string | null> = {},
  mortgagedProperties: string[] = [],
) {
  const initialState = createInitialGameState(setup)
  const nearPropertyState = {
    ...initialState,
    ownership: { ...initialState.ownership, ...ownershipOverrides },
    mortgagedProperties,
    players: initialState.players.map((player, index) =>
      index === 0 ? { ...player, position: 4 } : player,
    ),
  }
  const rolledState = gameReducer(nearPropertyState, { type: 'roll-dice', dice: [2, 2] })
  return gameReducer(rolledState, { type: 'move-player' })
}

function createRailroadLandingState(ownershipOverrides: Record<string, string | null> = {}) {
  const initialState = createInitialGameState(setup)
  const nearRailroadState = {
    ...initialState,
    ownership: { ...initialState.ownership, ...ownershipOverrides },
    players: initialState.players.map((player, index) =>
      index === 0 ? { ...player, position: 3 } : player,
    ),
  }
  const rolledState = gameReducer(nearRailroadState, { type: 'roll-dice', dice: [1, 1] })
  return gameReducer(rolledState, { type: 'move-player' })
}

function createUtilityLandingState(ownershipOverrides: Record<string, string | null> = {}) {
  const initialState = createInitialGameState(setup)
  const nearUtilityState = {
    ...initialState,
    ownership: { ...initialState.ownership, ...ownershipOverrides },
    players: initialState.players.map((player, index) =>
      index === 0 ? { ...player, position: 8 } : player,
    ),
  }
  const rolledState = gameReducer(nearUtilityState, { type: 'roll-dice', dice: [2, 2] })
  return gameReducer(rolledState, { type: 'move-player' })
}

describe('gameReducer skeleton', () => {
  it('dispatches recognized actions as safe no-ops without mutating or rolling randomly', () => {
    const state = createInitialGameState(setup)
    const initialSnapshot = JSON.stringify(state)
    const actions: GameAction[] = [
      { type: 'end-turn' },
      { type: 'mortgage-property', propertyId: 'mediterranean-avenue' },
      { type: 'build-house', propertyId: 'mediterranean-avenue' },
      { type: 'build-hotel', propertyId: 'mediterranean-avenue' },
      { type: 'sell-building', propertyId: 'mediterranean-avenue' },
      { type: 'buy-property', propertyId: 'mediterranean-avenue' },
      { type: 'decline-purchase', propertyId: 'mediterranean-avenue' },
    ]
    const randomSpy = vi.spyOn(Math, 'random')

    try {
      for (const action of actions) {
        expect(gameReducer(state, action)).toBe(state)
      }

      expect(JSON.stringify(state)).toBe(initialSnapshot)
      expect(randomSpy).not.toHaveBeenCalled()
    } finally {
      randomSpy.mockRestore()
    }
  })

  it('records a dice result once and blocks another roll during resolution', () => {
    const state = createInitialGameState(setup)
    const rolledState = gameReducer(state, { type: 'roll-dice', dice: [2, 5] })

    expect(rolledState).toMatchObject({ dice: [2, 5], phase: 'resolving-turn' })
    expect(rolledState).not.toBe(state)
    expect(rolledState.log).toEqual([
      { id: 'log-1', event: { type: 'roll', playerId: 'player-1', dice: [2, 5] } },
    ])
    expect(state).toMatchObject({ dice: null, phase: 'awaiting-roll' })
    expect(gameReducer(rolledState, { type: 'roll-dice', dice: [1, 1] })).toBe(rolledState)
  })

  it('moves only the active player by the stored dice total during resolution', () => {
    const state = createInitialGameState(setup)
    const rolledState = gameReducer(state, { type: 'roll-dice', dice: [2, 5] })
    const movedState = gameReducer(rolledState, { type: 'move-player' })

    expect(movedState.players.map((player) => player.position)).toEqual([7, 0])
    expect(movedState).toMatchObject({ dice: [2, 5], phase: 'awaiting-player-action' })
    expect(movedState.landingResolution).toEqual({
      type: 'card',
      spaceId: 'chance-1',
      deck: 'chance',
      legalActions: ['draw-card'],
    })
    expect(movedState.log.map(({ event }) => event)).toEqual([
      { type: 'roll', playerId: 'player-1', dice: [2, 5] },
      { type: 'movement', playerId: 'player-1', from: 0, to: 7, spacesMoved: 7 },
    ])
    expect(rolledState.players.map((player) => player.position)).toEqual([0, 0])
    expect(gameReducer(state, { type: 'move-player' })).toBe(state)
  })

  it('awards $200 only when movement passes GO', () => {
    const initialState = createInitialGameState(setup)
    const nearGoState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 39 } : player,
      ),
    }
    const rolledState = gameReducer(nearGoState, { type: 'roll-dice', dice: [1, 2] })
    const movedState = gameReducer(rolledState, { type: 'move-player' })

    expect(movedState.players[0]).toMatchObject({ position: 2, cash: 1700 })
    expect(movedState.players[1]).toMatchObject({ position: 0, cash: 1500 })
    expect(movedState.log.map(({ event }) => event)).toEqual([
      { type: 'roll', playerId: 'player-1', dice: [1, 2] },
      { type: 'movement', playerId: 'player-1', from: 39, to: 2, spacesMoved: 3 },
      { type: 'income', playerId: 'player-1', amount: 200, reason: 'go-salary' },
    ])
    expect(nearGoState.players[0]).toMatchObject({ position: 39, cash: 1500 })

    const noWrapState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 10 } : player,
      ),
    }
    const noWrapRoll = gameReducer(noWrapState, { type: 'roll-dice', dice: [1, 2] })
    const noWrapMove = gameReducer(noWrapRoll, { type: 'move-player' })

    expect(noWrapMove.players[0]).toMatchObject({ position: 13, cash: 1500 })
  })

  it('charges the selected income tax once and blocks ending the turn before payment', () => {
    const initialState = createInitialGameState(setup)
    const nearIncomeTaxState = {
      ...initialState,
      mortgagedProperties: ['vermont-avenue'],
      ownership: { ...initialState.ownership, 'vermont-avenue': 'player-1' },
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 2, cash: 1494 } : player,
      ),
    }
    const rolledState = gameReducer(nearIncomeTaxState, { type: 'roll-dice', dice: [1, 1] })
    const taxState = gameReducer(rolledState, { type: 'move-player' })

    expect(taxState.landingResolution).toEqual({
      type: 'tax',
      spaceId: 'income-tax',
      tax: 'income',
      legalActions: ['pay-tax'],
    })
    expect(gameReducer(taxState, { type: 'end-turn' })).toBe(taxState)

    const paidState = gameReducer(taxState, { type: 'pay-tax', choice: 'percentage' })
    expect(paidState.players[0]).toMatchObject({ cash: 1335 })
    expect(paidState.players[1]?.cash).toBe(1500)
    expect(paidState.landingResolution).toBeNull()
    expect(paidState.log.at(-1)?.event).toEqual({
      type: 'payment',
      payerId: 'player-1',
      payeeId: null,
      amount: 159,
      reason: 'tax',
    })
    expect(gameReducer(paidState, { type: 'pay-tax', choice: 'percentage' })).toBe(paidState)
  })

  it('charges the fixed luxury tax and rejects an income-tax percentage choice', () => {
    const initialState = createInitialGameState(setup)
    const nearLuxuryTaxState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 36 } : player,
      ),
    }
    const rolledState = gameReducer(nearLuxuryTaxState, { type: 'roll-dice', dice: [1, 1] })
    const taxState = gameReducer(rolledState, { type: 'move-player' })

    expect(gameReducer(taxState, { type: 'pay-tax', choice: 'percentage' })).toBe(taxState)

    const paidState = gameReducer(taxState, { type: 'pay-tax', choice: 'fixed' })
    expect(paidState.players[0]?.cash).toBe(1400)
    expect(paidState.log.at(-1)?.event).toEqual({
      type: 'payment',
      payerId: 'player-1',
      payeeId: null,
      amount: 100,
      reason: 'tax',
    })
  })

  it('charges base street rent to the active player and credits the owner once', () => {
    const state = createVermontLandingState({ 'vermont-avenue': 'player-2' })

    expect(state.players[0]).toMatchObject({ position: 8, cash: 1494 })
    expect(state.players[1]).toMatchObject({ cash: 1506 })
    expect(state.landingResolution).toEqual({
      type: 'owned-property',
      spaceId: 'vermont-avenue',
      spaceName: 'Vermont Avenue',
      ownerId: 'player-2',
      ownedByCurrentPlayer: false,
      legalActions: ['pay-rent'],
    })
    expect(state.log.at(-1)).toEqual({
      id: 'log-3',
      event: {
        type: 'payment',
        payerId: 'player-1',
        payeeId: 'player-2',
        amount: 6,
        reason: 'rent',
      },
    })
  })

  it('does not charge street rent for unowned or self-owned property', () => {
    const unownedState = createVermontLandingState()
    const selfOwnedState = createVermontLandingState({ 'vermont-avenue': 'player-1' })

    for (const state of [unownedState, selfOwnedState]) {
      expect(state.players.map((player) => player.cash)).toEqual([1500, 1500])
      expect(
        state.log.some(({ event }) => event.type === 'payment' && event.reason === 'rent'),
      ).toBe(false)
    }
  })

  it('skips rent on an opponent-owned mortgaged property and logs why', () => {
    const state = createVermontLandingState({ 'vermont-avenue': 'player-2' }, ['vermont-avenue'])

    expect(state.players[0]).toMatchObject({ position: 8, cash: 1500 })
    expect(state.players[1]).toMatchObject({ cash: 1500 })
    expect(state.landingResolution).toEqual({
      type: 'mortgaged-property',
      spaceId: 'vermont-avenue',
      spaceName: 'Vermont Avenue',
      ownerId: 'player-2',
      legalActions: ['continue'],
    })
    expect(state.log.at(-1)?.event).toEqual({
      type: 'rent-skipped',
      payerId: 'player-1',
      ownerId: 'player-2',
      propertyId: 'vermont-avenue',
      reason: 'mortgaged',
    })
  })

  it('charges double rent when the street owner holds the complete color group', () => {
    const state = createVermontLandingState({
      'oriental-avenue': 'player-2',
      'vermont-avenue': 'player-2',
      'connecticut-avenue': 'player-2',
    })

    expect(state.players[0]).toMatchObject({ cash: 1488 })
    expect(state.players[1]).toMatchObject({ cash: 1512 })
    expect(state.log.at(-1)?.event).toEqual({
      type: 'payment',
      payerId: 'player-1',
      payeeId: 'player-2',
      amount: 12,
      reason: 'rent',
    })
  })

  it('charges railroad rent based on how many railroads the owner holds', () => {
    const state = createRailroadLandingState({
      'reading-railroad': 'player-2',
      'pennsylvania-railroad': 'player-2',
    })

    expect(state.players[0]).toMatchObject({ position: 5, cash: 1450 })
    expect(state.players[1]).toMatchObject({ cash: 1550 })
    expect(state.log.at(-1)?.event).toEqual({
      type: 'payment',
      payerId: 'player-1',
      payeeId: 'player-2',
      amount: 50,
      reason: 'rent',
    })
  })

  it('charges utility rent from the stored dice total and credits the owner', () => {
    const state = createUtilityLandingState({ 'electric-company': 'player-2' })

    expect(state.players[0]).toMatchObject({ position: 12, cash: 1484 })
    expect(state.players[1]).toMatchObject({ cash: 1516 })
    expect(state.log.at(-1)?.event).toEqual({
      type: 'payment',
      payerId: 'player-1',
      payeeId: 'player-2',
      amount: 16,
      reason: 'rent',
    })
  })

  it('advances through all players in order and safely wraps to the first player', () => {
    let state = createInitialGameState({
      playerCount: 4,
      playerNames: ['Alex', 'Jordan', 'Casey', 'Morgan'],
      playerColors: ['red', 'blue', 'green', 'purple'],
    })

    for (let turn = 0; turn < 4; turn += 1) {
      const rolledState = gameReducer(state, { type: 'roll-dice', dice: [4, 6] })
      const movedState = gameReducer(rolledState, { type: 'move-player' })
      state = gameReducer(movedState, { type: 'end-turn' })

      expect(state.currentPlayerIndex).toBe((turn + 1) % 4)
      expect(state.phase).toBe('awaiting-roll')
      expect(state.dice).toBeNull()
      expect(state.landingResolution).toBeNull()
      expect(state.log.at(-1)?.event).toEqual({
        type: 'turn-change',
        fromPlayerId: `player-${turn + 1}`,
        toPlayerId: `player-${((turn + 1) % 4) + 1}`,
      })
    }
  })

  it('releases a jailed player on doubles, moves by the total, and resolves the landing', () => {
    const initialState = createInitialGameState(setup)
    const jailedState: GameState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 10, isInJail: true, jailTurns: 1 } : player,
      ),
    }

    expect(gameReducer(jailedState, { type: 'roll-dice', dice: [2, 2] })).toBe(jailedState)
    const attempt = gameReducer(jailedState, { type: 'roll-jail-attempt', dice: [2, 2] })
    expect(attempt).toMatchObject({
      phase: 'resolving-turn',
      dice: [2, 2],
      extraRollAvailable: false,
    })

    const movedState = gameReducer(attempt, { type: 'move-player' })
    expect(movedState.players[0]).toMatchObject({ position: 14, isInJail: false, jailTurns: 0 })
    expect(movedState.phase).toBe('awaiting-player-action')
    expect(movedState.extraRollAvailable).toBe(false)
    expect(movedState.landingResolution).toMatchObject({
      type: 'unowned-property',
      spaceId: 'virginia-avenue',
    })
    expect(movedState.log.map(({ event }) => event)).toEqual([
      { type: 'roll', playerId: 'player-1', dice: [2, 2] },
      { type: 'released-from-jail', playerId: 'player-1', method: 'doubles' },
      { type: 'movement', playerId: 'player-1', from: 10, to: 14, spacesMoved: 4 },
    ])
  })

  it('increments the Jail turn after a non-double attempt and lets the turn end', () => {
    const initialState = createInitialGameState(setup)
    const jailedState: GameState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 10, isInJail: true, jailTurns: 1 } : player,
      ),
    }
    const attempt = gameReducer(jailedState, { type: 'roll-jail-attempt', dice: [2, 3] })
    const resolvedState = gameReducer(attempt, { type: 'move-player' })

    expect(resolvedState.players[0]).toMatchObject({ position: 10, isInJail: true, jailTurns: 2 })
    expect(resolvedState).toMatchObject({
      phase: 'awaiting-player-action',
      extraRollAvailable: false,
      landingResolution: null,
    })
    expect(resolvedState.log.map(({ event }) => event)).toEqual([
      { type: 'roll', playerId: 'player-1', dice: [2, 3] },
    ])
    expect(gameReducer(resolvedState, { type: 'end-turn' }).currentPlayerIndex).toBe(1)
  })

  it('grants one extra roll for doubles and ends the turn after a non-double roll', () => {
    const initialState = createInitialGameState(setup)
    let state: GameState = {
      ...initialState,
      ownership: {
        ...initialState.ownership,
        'oriental-avenue': 'player-1',
        'connecticut-avenue': 'player-1',
      },
    }

    state = gameReducer(state, { type: 'roll-dice', dice: [3, 3] })
    expect(state).toMatchObject({ doublesCount: 1, extraRollAvailable: true })
    state = gameReducer(state, { type: 'move-player' })
    state = gameReducer(state, { type: 'end-turn' })
    expect(state).toMatchObject({
      currentPlayerIndex: 0,
      phase: 'awaiting-roll',
      dice: null,
      doublesCount: 1,
      extraRollAvailable: false,
    })

    state = gameReducer(state, { type: 'roll-dice', dice: [1, 2] })
    expect(state).toMatchObject({ doublesCount: 0, extraRollAvailable: false })
    state = gameReducer(state, { type: 'move-player' })
    state = gameReducer(state, { type: 'end-turn' })
    expect(state).toMatchObject({ currentPlayerIndex: 1, phase: 'awaiting-roll', doublesCount: 0 })
  })

  it('buys a pending property atomically, charging the active player and logging payment', () => {
    const state = createVermontPurchaseState()
    const purchasedState = gameReducer(state, {
      type: 'buy-property',
      propertyId: 'vermont-avenue',
    })

    expect(purchasedState.players[0]).toMatchObject({ cash: 1400 })
    expect(purchasedState.players[1]).toMatchObject({ cash: 1500 })
    expect(purchasedState.ownership['vermont-avenue']).toBe('player-1')
    expect(purchasedState.landingResolution).toBeNull()
    expect(purchasedState.phase).toBe('awaiting-player-action')
    expect(purchasedState.log.at(-1)).toEqual({
      id: 'log-3',
      event: {
        type: 'payment',
        payerId: 'player-1',
        payeeId: null,
        amount: 100,
        reason: 'property-purchase',
      },
    })
    expect(state.players[0]?.cash).toBe(1500)
    expect(state.ownership['vermont-avenue']).toBeNull()
  })

  it('rejects mismatched, unaffordable, or already-owned purchase requests without changes', () => {
    const state = createVermontPurchaseState()
    const poorState = {
      ...state,
      players: state.players.map((player, index) =>
        index === 0 ? { ...player, cash: 50 } : player,
      ),
    }
    const alreadyOwnedState = {
      ...state,
      ownership: { ...state.ownership, 'vermont-avenue': 'player-2' },
    }

    expect(gameReducer(state, { type: 'buy-property', propertyId: 'baltic-avenue' })).toBe(state)
    expect(gameReducer(poorState, { type: 'buy-property', propertyId: 'vermont-avenue' })).toBe(
      poorState,
    )
    expect(
      gameReducer(alreadyOwnedState, {
        type: 'buy-property',
        propertyId: 'vermont-avenue',
      }),
    ).toBe(alreadyOwnedState)
  })

  it('clears a matching purchase offer when declined but rejects unrelated decline actions', () => {
    const state = createVermontPurchaseState()
    const declinedState = gameReducer(state, {
      type: 'decline-purchase',
      propertyId: 'vermont-avenue',
    })

    expect(declinedState.landingResolution).toBeNull()
    expect(declinedState.phase).toBe('auction')
    expect(declinedState.auction).toEqual({
      propertyId: 'vermont-avenue',
      biddingOrder: ['player-2', 'player-1'],
      activeBidderId: 'player-2',
      highBid: 0,
      highBidderId: null,
      passedPlayerIds: [],
    })
    expect(declinedState.players[0]?.cash).toBe(1500)
    expect(declinedState.ownership['vermont-avenue']).toBeNull()
    expect(
      gameReducer(declinedState, { type: 'decline-purchase', propertyId: 'vermont-avenue' }),
    ).toBe(declinedState)
    expect(gameReducer(state, { type: 'decline-purchase', propertyId: 'baltic-avenue' })).toBe(
      state,
    )
  })

  it('rotates a four-player auction so bidding starts with the next player', () => {
    const initialState = createInitialGameState({
      playerCount: 4,
      playerNames: ['Alex', 'Jordan', 'Casey', 'Morgan'],
      playerColors: ['red', 'blue', 'green', 'purple'],
    })
    const nearPropertyState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 4 } : player,
      ),
    }
    const rolledState = gameReducer(nearPropertyState, { type: 'roll-dice', dice: [2, 2] })
    const landedState = gameReducer(rolledState, { type: 'move-player' })
    const auctionState = gameReducer(landedState, {
      type: 'decline-purchase',
      propertyId: 'vermont-avenue',
    })

    expect(auctionState.auction).toMatchObject({
      biddingOrder: ['player-2', 'player-3', 'player-4', 'player-1'],
      activeBidderId: 'player-2',
    })
  })

  it('rejects invalid bids and awards the property to the valid high bidder', () => {
    const landingState = createVermontPurchaseState()
    const auctionState = gameReducer(landingState, {
      type: 'decline-purchase',
      propertyId: 'vermont-avenue',
    })
    const overCashState = gameReducer(auctionState, { type: 'auction-bid', amount: 1501 })
    const zeroBidState = gameReducer(auctionState, { type: 'auction-bid', amount: 0 })

    expect(overCashState).toBe(auctionState)
    expect(zeroBidState).toBe(auctionState)

    const highBidState = gameReducer(auctionState, { type: 'auction-bid', amount: 50 })
    expect(highBidState.auction).toMatchObject({ highBid: 50, highBidderId: 'player-2' })
    expect(highBidState.auction?.activeBidderId).toBe('player-1')

    const awardedState = gameReducer(highBidState, { type: 'auction-pass' })
    expect(awardedState.phase).toBe('awaiting-player-action')
    expect(awardedState.auction).toBeNull()
    expect(awardedState.ownership['vermont-avenue']).toBe('player-2')
    expect(awardedState.players[0]?.cash).toBe(1500)
    expect(awardedState.players[1]?.cash).toBe(1450)
    expect(awardedState.log.slice(-2).map(({ event }) => event)).toEqual([
      {
        type: 'payment',
        payerId: 'player-2',
        payeeId: null,
        amount: 50,
        reason: 'property-purchase',
      },
      {
        type: 'auction-ended',
        propertyId: 'vermont-avenue',
        winnerId: 'player-2',
        amount: 50,
      },
    ])
  })

  it('closes a no-bid auction and returns the turn without transferring the deed', () => {
    const landingState = createVermontPurchaseState()
    const auctionState = gameReducer(landingState, {
      type: 'decline-purchase',
      propertyId: 'vermont-avenue',
    })
    const firstPass = gameReducer(auctionState, { type: 'auction-pass' })
    const noBidState = gameReducer(firstPass, { type: 'auction-pass' })

    expect(firstPass.auction?.activeBidderId).toBe('player-1')
    expect(noBidState.phase).toBe('awaiting-player-action')
    expect(noBidState.auction).toBeNull()
    expect(noBidState.ownership['vermont-avenue']).toBeNull()
    expect(noBidState.players.map(({ cash }) => cash)).toEqual([1500, 1500])
    expect(noBidState.log.at(-1)?.event).toEqual({
      type: 'auction-ended',
      propertyId: 'vermont-avenue',
      winnerId: null,
      amount: 0,
    })
  })

  it('preserves the current state for an unknown or malformed action', () => {
    const state = createInitialGameState(setup)
    const invalidAction = { type: 'skip-turn', extra: true } as unknown as GameAction

    expect(gameReducer(state, invalidAction)).toBe(state)
  })
})
