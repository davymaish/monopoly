import type { PlayerColor } from '../setup/config'
import type { CardDeck } from './cards'

export type PlayerId = string
export type DieValue = 1 | 2 | 3 | 4 | 5 | 6
export type DiceRoll = readonly [DieValue, DieValue]
export type TaxPaymentChoice = 'fixed' | 'percentage'

export type GamePhase =
  'awaiting-roll' | 'resolving-turn' | 'awaiting-player-action' | 'auction' | 'game-over'

export interface Player {
  id: PlayerId
  name: string
  color: PlayerColor
  cash: number
  position: number
  isInJail: boolean
  jailTurns: number
  getOutOfJailFreeCardCount: number
}

export interface AuctionState {
  propertyId: string
  biddingOrder: PlayerId[]
  activeBidderId: PlayerId
  highBid: number
  highBidderId: PlayerId | null
  passedPlayerIds: PlayerId[]
}

export interface DebtResolutionState {
  debtorId: PlayerId
  creditorId: PlayerId | null
  amount: number
  reason: 'jail-bail'
  resumeJailMovement: boolean
}

export interface DrawnCard {
  deck: CardDeck
  cardId: string
  playerId: PlayerId
}

export type HeldJailFreeCard = DrawnCard

export type PropertyOwnership = Record<string, PlayerId | null>

export interface PropertyBuildingCounts {
  houses: number
  hotels: number
}

export type PropertyBuildings = Record<string, PropertyBuildingCounts>

export interface CardDeckState {
  chance: string[]
  communityChest: string[]
}

export type GameLogEvent =
  | { type: 'roll'; playerId: PlayerId; dice: DiceRoll }
  | { type: 'movement'; playerId: PlayerId; from: number; to: number; spacesMoved: number }
  | { type: 'sent-to-jail'; playerId: PlayerId; source: 'board' | 'card' | 'third-double' }
  | {
      type: 'released-from-jail'
      playerId: PlayerId
      method: 'doubles' | 'bail' | 'jail-free-card'
    }
  | {
      type: 'income'
      playerId: PlayerId
      amount: number
      reason: 'go-salary' | 'card' | 'building-sale' | 'mortgage'
    }
  | {
      type: 'payment'
      payerId: PlayerId
      payeeId: PlayerId | null
      amount: number
      reason:
        | 'rent'
        | 'tax'
        | 'property-purchase'
        | 'house-purchase'
        | 'hotel-purchase'
        | 'card'
        | 'jail-bail'
    }
  | {
      type: 'rent-skipped'
      payerId: PlayerId
      ownerId: PlayerId
      propertyId: string
      reason: 'mortgaged'
    }
  | { type: 'auction-ended'; propertyId: string; winnerId: PlayerId | null; amount: number }
  | { type: 'card-drawn'; playerId: PlayerId; deck: CardDeck; cardId: string }
  | { type: 'card-returned'; playerId: PlayerId; deck: CardDeck; cardId: string }
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
  | {
      type: 'mortgaged-property'
      spaceId: string
      spaceName: string
      ownerId: PlayerId
      legalActions: readonly ['continue']
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
  propertyBuildings: PropertyBuildings
  mortgagedProperties: string[]
  auction: AuctionState | null
  landingResolution: LandingResolution | null
  dice: DiceRoll | null
  decks: CardDeckState
  pendingCard: DrawnCard | null
  heldJailFreeCards: HeldJailFreeCard[]
  doublesCount: number
  extraRollAvailable: boolean
  jailAttemptInProgress: boolean
  debtResolution: DebtResolutionState | null
  log: GameLogEntry[]
  phase: GamePhase
}
