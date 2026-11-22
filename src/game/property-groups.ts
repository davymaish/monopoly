import type { BoardSpace, PropertyGroup, PropertySpace } from './board-space'

export interface PropertyGroupDefinition {
  label: string
  propertyCount: 2 | 3
}

export const PROPERTY_GROUPS = {
  brown: { label: 'Brown', propertyCount: 2 },
  'light-blue': { label: 'Light Blue', propertyCount: 3 },
  pink: { label: 'Pink', propertyCount: 3 },
  orange: { label: 'Orange', propertyCount: 3 },
  red: { label: 'Red', propertyCount: 3 },
  yellow: { label: 'Yellow', propertyCount: 3 },
  green: { label: 'Green', propertyCount: 3 },
  'dark-blue': { label: 'Dark Blue', propertyCount: 2 },
} as const satisfies Record<PropertyGroup, PropertyGroupDefinition>

export function getPropertiesInGroup(
  spaces: readonly BoardSpace[],
  group: PropertyGroup,
): PropertySpace[] {
  return spaces.filter(
    (space): space is PropertySpace => space.kind === 'property' && space.group === group,
  )
}

export function hasCompletePropertyGroup(
  spaces: readonly BoardSpace[],
  group: PropertyGroup,
): boolean {
  return getPropertiesInGroup(spaces, group).length === PROPERTY_GROUPS[group].propertyCount
}
