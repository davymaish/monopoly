import type { PropertyOwnership } from './model'
import { RAILROADS } from './railroad-data'
import { STREET_PROPERTIES } from './street-data'
import { calculateUtilityRent as calculateRentFromUtilityCount, UTILITIES } from './utility-data'

export function calculateUtilityPropertyRent(
  utilityId: string,
  ownership: PropertyOwnership,
  diceTotal: number,
  useNearestUtilityCardMultiplier = false,
): number {
  const utility = UTILITIES.find((candidate) => candidate.id === utilityId)
  const ownerId = ownership[utilityId]

  if (!utility || !ownerId) {
    return 0
  }

  const ownedUtilityCount = UTILITIES.filter(({ id }) => ownership[id] === ownerId).length

  if (ownedUtilityCount === 0) {
    return 0
  }

  return useNearestUtilityCardMultiplier
    ? diceTotal * 10
    : calculateRentFromUtilityCount(diceTotal, ownedUtilityCount as 1 | 2)
}

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
