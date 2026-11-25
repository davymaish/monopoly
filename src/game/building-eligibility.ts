import { BOARD_SPACES } from './board'
import type { PropertySpace } from './board-space'
import { getPropertiesInGroup, PROPERTY_GROUPS } from './property-groups'
import type { PlayerId, PropertyBuildings, PropertyOwnership } from './model'

export type BuildingEligibilityReason =
  'not-a-street' | 'not-owner' | 'incomplete-group' | 'mortgaged-group' | 'uneven-group-development'

export interface BuildingEligibility {
  eligible: boolean
  reason: BuildingEligibilityReason | null
}

interface BuildingEligibilityInput {
  playerId: PlayerId
  propertyId: string
  ownership: PropertyOwnership
  mortgagedProperties: readonly string[]
}

interface HouseBuildingEligibilityInput extends BuildingEligibilityInput {
  propertyBuildings: PropertyBuildings
}

function blocked(reason: BuildingEligibilityReason): BuildingEligibility {
  return { eligible: false, reason }
}

function getStreet(propertyId: string): PropertySpace | undefined {
  return BOARD_SPACES.find(
    (space): space is PropertySpace => space.id === propertyId && space.kind === 'property',
  )
}

export function getBuildingEligibility({
  playerId,
  propertyId,
  ownership,
  mortgagedProperties,
}: BuildingEligibilityInput): BuildingEligibility {
  const property = getStreet(propertyId)

  if (!property) return blocked('not-a-street')
  if (ownership[propertyId] !== playerId) return blocked('not-owner')

  const groupProperties = getPropertiesInGroup(BOARD_SPACES, property.group)
  if (
    groupProperties.length !== PROPERTY_GROUPS[property.group].propertyCount ||
    groupProperties.some(({ id }) => ownership[id] !== playerId)
  ) {
    return blocked('incomplete-group')
  }

  const groupPropertyIds = new Set(groupProperties.map(({ id }) => id))
  if (mortgagedProperties.some((id) => groupPropertyIds.has(id))) {
    return blocked('mortgaged-group')
  }

  return { eligible: true, reason: null }
}

export function getHouseBuildingEligibility({
  playerId,
  propertyId,
  ownership,
  mortgagedProperties,
  propertyBuildings,
}: HouseBuildingEligibilityInput): BuildingEligibility {
  const groupEligibility = getBuildingEligibility({
    playerId,
    propertyId,
    ownership,
    mortgagedProperties,
  })
  if (!groupEligibility.eligible) return groupEligibility

  const property = getStreet(propertyId)
  if (!property) return blocked('not-a-street')

  const groupProperties = getPropertiesInGroup(BOARD_SPACES, property.group)
  const houseCounts = groupProperties.map(({ id }) => propertyBuildings[id]?.houses ?? 0)
  const projectedCounts = houseCounts.map((count, index) =>
    groupProperties[index]?.id === propertyId ? count + 1 : count,
  )
  const lowestProjectedCount = Math.min(...projectedCounts)
  const highestProjectedCount = Math.max(...projectedCounts)

  return highestProjectedCount - lowestProjectedCount > 1
    ? blocked('uneven-group-development')
    : { eligible: true, reason: null }
}
