import type { DiceRoll, GameState } from './model'

export type GameAction =
  | { type: 'roll-dice'; dice: DiceRoll }
  | { type: 'move-player' }
  | { type: 'end-turn' }
  | { type: 'buy-property'; propertyId: string }
  | { type: 'decline-purchase'; propertyId: string }

export type GameReducer = (state: GameState, action: GameAction) => GameState
