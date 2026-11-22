import { describe, expect, expectTypeOf, it } from 'vitest'
import type { GameAction, GameReducer } from '../game/actions'
import type { GameState } from '../game/model'

describe('game action contract', () => {
  it('uses a discriminated union with payloads only for property decisions', () => {
    expectTypeOf<GameAction>().toEqualTypeOf<
      | { type: 'roll-dice' }
      | { type: 'end-turn' }
      | { type: 'buy-property'; propertyId: string }
      | { type: 'decline-purchase'; propertyId: string }
    >()
  })

  it('defines a reducer as a pure state/action-to-state transition', () => {
    expectTypeOf<GameReducer>().toEqualTypeOf<(state: GameState, action: GameAction) => GameState>()
    expect({ type: 'roll-dice' } satisfies GameAction).toEqual({ type: 'roll-dice' })
    expect({ type: 'buy-property', propertyId: 'boardwalk' } satisfies GameAction).toEqual({
      type: 'buy-property',
      propertyId: 'boardwalk',
    })
  })
})
