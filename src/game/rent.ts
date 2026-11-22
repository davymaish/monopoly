import type { PropertyOwnership } from './model'
import { RAILROADS } from './railroad-data'
import { STREET_PROPERTIES } from './street-data'

export function calculateRailroadRent(
  railroadId: string,
  ownership: PropertyOwnership,
  rentMultiplier: 1 | 2 = 1,
): number {
  const railroad = RAILROADS.find((candidate) => candidate.id === railroadId)
  const ownerId = ownership[railroadId]

  if (!railroad || !ownerId) {
    return 0
  }

  const ownedRailroadCount = RAILROADS.filter(({ id }) => ownership[id] === ownerId).length
  const rent = railroad.rentByRailroadsOwned[ownedRailroadCount - 1]

  return rent ? rent * rentMultiplier : 0
}

export function calculateStreetRent(propertyId: string, ownership: PropertyOwnership): number {
  const property = STREET_PROPERTIES.find((street) => street.id === propertyId)
  const ownerId = ownership[propertyId]

  if (!property || !ownerId) {
    return 0
  }

  const groupProperties = STREET_PROPERTIES.filter((street) => street.group === property.group)
  const ownerHasCompleteGroup = groupProperties.every((street) => ownership[street.id] === ownerId)

  return ownerHasCompleteGroup ? property.rents.completeGroup : property.rents.base
}
