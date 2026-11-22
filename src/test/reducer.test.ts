import { describe, expect, it, vi } from 'vitest'
import type { GameAction } from '../game/actions'
import { createInitialGameState } from '../game/initial-state'
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

function createVermontLandingState(ownershipOverrides: Record<string, string | null> = {}) {
  const initialState = createInitialGameState(setup)
  const nearPropertyState = {
    ...initialState,
    ownership: { ...initialState.ownership, ...ownershipOverrides },
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

describe('gameReducer skeleton', () => {
  it('dispatches recognized actions as safe no-ops without mutating or rolling randomly', () => {
    const state = createInitialGameState(setup)
    const initialSnapshot = JSON.stringify(state)
    const actions: GameAction[] = [
      { type: 'end-turn' },
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

  it('advances through all players in order and safely wraps to the first player', () => {
    let state = createInitialGameState({
      playerCount: 4,
      playerNames: ['Alex', 'Jordan', 'Casey', 'Morgan'],
      playerColors: ['red', 'blue', 'green', 'purple'],
    })

    for (let turn = 0; turn < 4; turn += 1) {
      const rolledState = gameReducer(state, { type: 'roll-dice', dice: [1, 1] })
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
    expect(declinedState.players[0]?.cash).toBe(1500)
    expect(declinedState.ownership['vermont-avenue']).toBeNull()
    expect(gameReducer(state, { type: 'decline-purchase', propertyId: 'baltic-avenue' })).toBe(
      state,
    )
  })

  it('preserves the current state for an unknown or malformed action', () => {
    const state = createInitialGameState(setup)
    const invalidAction = { type: 'skip-turn', extra: true } as unknown as GameAction

    expect(gameReducer(state, invalidAction)).toBe(state)
  })
})
