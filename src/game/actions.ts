import type { DiceRoll, GameState, TaxPaymentChoice } from './model'
import type { CardDeck } from './cards'

export type GameAction =
  | { type: 'roll-dice'; dice: DiceRoll }
  | { type: 'roll-jail-attempt'; dice: DiceRoll }
  | { type: 'pay-jail-bail' }
  | { type: 'use-jail-free-card' }
  | { type: 'move-player' }
  | { type: 'end-turn' }
  | { type: 'buy-property'; propertyId: string }
  | { type: 'build-house'; propertyId: string }
  | { type: 'decline-purchase'; propertyId: string }
  | { type: 'auction-bid'; amount: number }
  | { type: 'auction-pass' }
  | { type: 'pay-tax'; choice: TaxPaymentChoice }
  | { type: 'draw-card'; deck: CardDeck }
  | { type: 'complete-card' }

export type GameReducer = (state: GameState, action: GameAction) => GameState
