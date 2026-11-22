import type { GameState } from './model'

export type GameAction =
  | { type: 'roll-dice' }
  | { type: 'end-turn' }
  | { type: 'buy-property'; propertyId: string }
  | { type: 'decline-purchase'; propertyId: string }

export type GameReducer = (state: GameState, action: GameAction) => GameState
