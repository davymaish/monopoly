import type { PropertyOwnership } from './model'
import { STREET_PROPERTIES } from './street-data'

export function calculateBaseStreetRent(propertyId: string, ownership: PropertyOwnership): number {
  const property = STREET_PROPERTIES.find((street) => street.id === propertyId)
  const ownerId = ownership[propertyId]

  if (!property || !ownerId) {
    return 0
  }

  const groupProperties = STREET_PROPERTIES.filter((street) => street.group === property.group)
  const ownerHasCompleteGroup = groupProperties.every((street) => ownership[street.id] === ownerId)

  return ownerHasCompleteGroup ? 0 : property.rents.base
}
