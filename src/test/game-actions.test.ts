import { describe, expect, expectTypeOf, it } from 'vitest'
import type { GameAction, GameReducer } from '../game/actions'
import type { DiceRoll, GameState } from '../game/model'

describe('game action contract', () => {
  it('uses a discriminated union with only the payloads each transition needs', () => {
    expectTypeOf<GameAction>().toEqualTypeOf<
      | { type: 'roll-dice'; dice: DiceRoll }
      | { type: 'end-turn' }
      | { type: 'buy-property'; propertyId: string }
      | { type: 'decline-purchase'; propertyId: string }
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
  })
})
