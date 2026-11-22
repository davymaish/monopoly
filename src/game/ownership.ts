import { BOARD_SPACES } from './board'
import type { BoardSpace } from './board-space'
import type { PlayerId, PropertyOwnership } from './model'

function isPurchasableSpace(space: BoardSpace): boolean {
  return space.kind === 'property' || space.kind === 'railroad' || space.kind === 'utility'
}

export function createInitialPropertyOwnership(
  spaces: readonly BoardSpace[] = BOARD_SPACES,
): PropertyOwnership {
  const ownership: PropertyOwnership = {}

  for (const space of spaces) {
    if (isPurchasableSpace(space)) {
      ownership[space.id] = null
    }
  }

  return ownership
}

export function isValidPropertyOwnership(
  ownership: PropertyOwnership,
  playerIds: readonly PlayerId[],
  spaces: readonly BoardSpace[] = BOARD_SPACES,
): boolean {
  const propertyIds = spaces.filter(isPurchasableSpace).map(({ id }) => id)
  const ownerIds = new Set(playerIds)

  return (
    Object.keys(ownership).length === propertyIds.length &&
    propertyIds.every((propertyId) => {
      if (!Object.prototype.hasOwnProperty.call(ownership, propertyId)) {
        return false
      }

      const ownerId = ownership[propertyId]
      return ownerId === null || ownerIds.has(ownerId)
    })
  )
}

export function getOwnedPropertyIds(ownership: PropertyOwnership, playerId: PlayerId): string[] {
  return Object.entries(ownership)
    .filter(([, ownerId]) => ownerId === playerId)
    .map(([propertyId]) => propertyId)
}
