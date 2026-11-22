import type { PlayerColor } from '../setup/config'

export type PlayerId = string
export type DieValue = 1 | 2 | 3 | 4 | 5 | 6
export type DiceRoll = readonly [DieValue, DieValue]

export type GamePhase = 'awaiting-roll' | 'resolving-turn' | 'awaiting-player-action' | 'game-over'

export interface Player {
  id: PlayerId
  name: string
  color: PlayerColor
  cash: number
  position: number
  ownedPropertyIds: string[]
  getOutOfJailFreeCardCount: number
}

export type PropertyOwnership = Record<string, PlayerId | null>

export interface CardDeckState {
  chance: string[]
  communityChest: string[]
}

export type GameLogEvent =
  | { type: 'roll'; playerId: PlayerId; dice: DiceRoll }
  | { type: 'movement'; playerId: PlayerId; from: number; to: number; spacesMoved: number }
  | { type: 'income'; playerId: PlayerId; amount: number; reason: 'go-salary' }
  | {
      type: 'payment'
      payerId: PlayerId
      payeeId: PlayerId | null
      amount: number
      reason: 'rent' | 'tax' | 'property-purchase' | 'card' | 'jail-bail'
    }
  | { type: 'turn-change'; fromPlayerId: PlayerId; toPlayerId: PlayerId }

export interface GameLogEntry {
  id: string
  event: GameLogEvent
}

export interface GameState {
  players: Player[]
  currentPlayerIndex: number
  ownership: PropertyOwnership
  dice: DiceRoll | null
  decks: CardDeckState
  log: GameLogEntry[]
  phase: GamePhase
}
