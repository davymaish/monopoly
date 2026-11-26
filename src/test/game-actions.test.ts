import { describe, expect, expectTypeOf, it } from 'vitest'
import type { GameAction, GameReducer } from '../game/actions'
import type { DiceRoll, GameState } from '../game/model'

describe('game action contract', () => {
  it('uses a discriminated union with only the payloads each transition needs', () => {
    expectTypeOf<GameAction>().toEqualTypeOf<
      | { type: 'roll-dice'; dice: DiceRoll }
      | { type: 'roll-jail-attempt'; dice: DiceRoll }
      | { type: 'pay-jail-bail' }
      | { type: 'pay-debt' }
      | { type: 'use-jail-free-card' }
      | { type: 'move-player' }
      | { type: 'end-turn' }
      | { type: 'buy-property'; propertyId: string }
      | { type: 'mortgage-property'; propertyId: string }
      | { type: 'unmortgage-property'; propertyId: string }
      | { type: 'build-house'; propertyId: string }
      | { type: 'build-hotel'; propertyId: string }
      | { type: 'sell-building'; propertyId: string }
      | { type: 'decline-purchase'; propertyId: string }
      | { type: 'auction-bid'; amount: number }
      | { type: 'auction-pass' }
      | { type: 'pay-tax'; choice: 'fixed' | 'percentage' }
      | { type: 'draw-card'; deck: 'chance' | 'community-chest' }
      | { type: 'complete-card' }
    >()
  })

  it('defines a reducer as a pure state/action-to-state transition', () => {
    expectTypeOf<GameReducer>().toEqualTypeOf<(state: GameState, action: GameAction) => GameState>()
    expect({ type: 'roll-dice', dice: [2, 4] } satisfies GameAction).toEqual({
      type: 'roll-dice',
      dice: [2, 4],
    })
    expect({ type: 'buy-property', propertyId: 'boardwalk' } satisfies GameAction).toEqual({
      type: 'buy-property',
      propertyId: 'boardwalk',
    })
    expect({ type: 'auction-bid', amount: 50 } satisfies GameAction).toEqual({
      type: 'auction-bid',
      amount: 50,
    })
    expect({ type: 'pay-tax', choice: 'percentage' } satisfies GameAction).toEqual({
      type: 'pay-tax',
      choice: 'percentage',
    })
    expect({ type: 'draw-card', deck: 'chance' } satisfies GameAction).toEqual({
      type: 'draw-card',
      deck: 'chance',
    })
    expect({ type: 'complete-card' } satisfies GameAction).toEqual({ type: 'complete-card' })
  })
})
