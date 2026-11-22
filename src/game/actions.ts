import type { GameState } from './model'
import type { DiceRoll } from './model'

export type GameAction =
  | { type: 'roll-dice'; dice: DiceRoll }
  | { type: 'end-turn' }
  | { type: 'buy-property'; propertyId: string }
  | { type: 'decline-purchase'; propertyId: string }

export type GameReducer = (state: GameState, action: GameAction) => GameState
