import { BOARD_SPACES } from './board'
import type { PropertySpace } from './board-space'
import { getPropertiesInGroup, PROPERTY_GROUPS } from './property-groups'
import type { PlayerId, PropertyOwnership } from './model'

export type BuildingEligibilityReason =
  'not-a-street' | 'not-owner' | 'incomplete-group' | 'mortgaged-group'

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

function blocked(reason: BuildingEligibilityReason): BuildingEligibility {
  return { eligible: false, reason }
}

export function getBuildingEligibility({
  playerId,
  propertyId,
  ownership,
  mortgagedProperties,
}: BuildingEligibilityInput): BuildingEligibility {
  const property = BOARD_SPACES.find(
    (space): space is PropertySpace => space.id === propertyId && space.kind === 'property',
  )

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
