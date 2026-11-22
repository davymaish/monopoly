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

export type LandingResolution =
  | {
      type: 'unowned-property'
      spaceId: string
      spaceName: string
      legalActions: readonly ['buy-property', 'decline-purchase']
    }
  | {
      type: 'owned-property'
      spaceId: string
      spaceName: string
      ownerId: PlayerId
      ownedByCurrentPlayer: true
      legalActions: readonly ['continue']
    }
  | {
      type: 'owned-property'
      spaceId: string
      spaceName: string
      ownerId: PlayerId
      ownedByCurrentPlayer: false
      legalActions: readonly ['pay-rent']
    }
  | { type: 'tax'; spaceId: string; tax: 'income' | 'luxury'; legalActions: readonly ['pay-tax'] }
  | {
      type: 'card'
      spaceId: string
      deck: 'chance' | 'community-chest'
      legalActions: readonly ['draw-card']
    }
  | { type: 'go'; spaceId: string; legalActions: readonly ['continue'] }
  | { type: 'jail-visit'; spaceId: string; legalActions: readonly ['continue'] }
  | { type: 'go-to-jail'; spaceId: string; legalActions: readonly ['go-to-jail'] }
  | { type: 'parking'; spaceId: string; legalActions: readonly ['continue'] }
  | {
      type: 'unsupported'
      spaceId: string | null
      reason: 'unknown-space' | 'ownership-missing' | 'invalid-owner'
      legalActions: readonly ['continue']
    }

export interface GameState {
  players: Player[]
  currentPlayerIndex: number
  ownership: PropertyOwnership
  landingResolution: LandingResolution | null
  dice: DiceRoll | null
  decks: CardDeckState
  log: GameLogEntry[]
  phase: GamePhase
}
