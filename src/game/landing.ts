import type { BoardSpace } from './board-space'
import type { LandingResolution, PlayerId, PropertyOwnership } from './model'

export function resolveLanding(
  space: BoardSpace | undefined,
  ownership: PropertyOwnership,
  playerIds: readonly PlayerId[],
  currentPlayerId: PlayerId,
): LandingResolution {
  if (!space) {
    return {
      type: 'unsupported',
      spaceId: null,
      reason: 'unknown-space',
      legalActions: ['continue'],
    }
  }

  switch (space.kind) {
    case 'property':
    case 'railroad':
    case 'utility': {
      if (!Object.prototype.hasOwnProperty.call(ownership, space.id)) {
        return {
          type: 'unsupported',
          spaceId: space.id,
          reason: 'ownership-missing',
          legalActions: ['continue'],
        }
      }

      const ownerId = ownership[space.id]
      if (ownerId === null) {
        return {
          type: 'unowned-property',
          spaceId: space.id,
          spaceName: space.name,
          legalActions: ['buy-property', 'decline-purchase'],
        }
      }

      if (!playerIds.includes(ownerId)) {
        return {
          type: 'unsupported',
          spaceId: space.id,
          reason: 'invalid-owner',
          legalActions: ['continue'],
        }
      }

      return ownerId === currentPlayerId
        ? {
            type: 'owned-property',
            spaceId: space.id,
            spaceName: space.name,
            ownerId,
            ownedByCurrentPlayer: true,
            legalActions: ['continue'],
          }
        : {
            type: 'owned-property',
            spaceId: space.id,
            spaceName: space.name,
            ownerId,
            ownedByCurrentPlayer: false,
            legalActions: ['pay-rent'],
          }
    }
    case 'tax':
      return { type: 'tax', spaceId: space.id, tax: space.tax, legalActions: ['pay-tax'] }
    case 'card':
      return { type: 'card', spaceId: space.id, deck: space.deck, legalActions: ['draw-card'] }
    case 'corner':
      switch (space.corner) {
        case 'go':
          return { type: 'go', spaceId: space.id, legalActions: ['continue'] }
        case 'jail':
          return { type: 'jail-visit', spaceId: space.id, legalActions: ['continue'] }
        case 'go-to-jail':
          return { type: 'go-to-jail', spaceId: space.id, legalActions: ['go-to-jail'] }
      }
    case 'parking':
      return { type: 'parking', spaceId: space.id, legalActions: ['continue'] }
    default:
      return {
        type: 'unsupported',
        spaceId: null,
        reason: 'unknown-space',
        legalActions: ['continue'],
      }
  }
}
