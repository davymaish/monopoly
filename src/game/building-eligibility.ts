import { BOARD_SPACES } from './board'
import type { PropertySpace } from './board-space'
import { getPropertiesInGroup, PROPERTY_GROUPS } from './property-groups'
import type { PlayerId, PropertyBuildings, PropertyOwnership } from './model'

export type BuildingEligibilityReason =
  | 'not-a-street'
  | 'not-owner'
  | 'incomplete-group'
  | 'mortgaged-group'
  | 'uneven-group-development'
  | 'hotel-not-ready'
  | 'no-buildings'

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

function getDevelopmentLevel(buildings: PropertyBuildings[string] | undefined): number {
  if (buildings?.hotels === 1 && buildings.houses === 0) return 5
  if (buildings?.hotels === 0 && buildings.houses <= 4) return buildings.houses
  return -1
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

export function getHotelBuildingEligibility({
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
  const targetBuildings = propertyBuildings[propertyId]
  if (!property || targetBuildings?.houses !== 4 || targetBuildings.hotels !== 0) {
    return blocked('hotel-not-ready')
  }

  const groupProperties = getPropertiesInGroup(BOARD_SPACES, property.group)
  const developmentLevels = groupProperties.map(({ id }) =>
    getDevelopmentLevel(propertyBuildings[id]),
  )

  if (
    developmentLevels.some((level) => level < 4) ||
    Math.max(...developmentLevels) - Math.min(...developmentLevels) > 1
  ) {
    return blocked('hotel-not-ready')
  }

  return { eligible: true, reason: null }
}

export function getBuildingSaleEligibility({
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
  const targetBuildings = propertyBuildings[propertyId]
  if (!property || !targetBuildings) return blocked('no-buildings')

  const targetLevel = getDevelopmentLevel(targetBuildings)
  if (targetLevel <= 0) return blocked('no-buildings')

  const groupProperties = getPropertiesInGroup(BOARD_SPACES, property.group)
  const projectedLevels = groupProperties.map(({ id }) => {
    const level = getDevelopmentLevel(propertyBuildings[id])
    return id === propertyId ? level - 1 : level
  })

  if (
    projectedLevels.some((level) => level < 0) ||
    Math.max(...projectedLevels) - Math.min(...projectedLevels) > 1
  ) {
    return blocked('uneven-group-development')
  }

  return { eligible: true, reason: null }
}
