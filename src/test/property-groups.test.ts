import { describe, expect, it } from 'vitest'
import type { BoardSpace, PropertyGroup } from '../game/board-space'
import {
  getPropertiesInGroup,
  hasCompletePropertyGroup,
  PROPERTY_GROUPS,
} from '../game/property-groups'

function property(id: string, group: PropertyGroup, position: number): BoardSpace {
  return { id, position, name: id, kind: 'property', group }
}

describe('property groups', () => {
  it('defines all eight groups and the number of streets in each', () => {
    expect(Object.keys(PROPERTY_GROUPS).sort()).toEqual(
      ['brown', 'light-blue', 'pink', 'orange', 'red', 'yellow', 'green', 'dark-blue'].sort(),
    )
    expect(Object.values(PROPERTY_GROUPS).map(({ propertyCount }) => propertyCount)).toEqual([
      2, 3, 3, 3, 3, 3, 3, 2,
    ])
  })

  it('derives group membership from each space’s group data, not its position', () => {
    const spaces: BoardSpace[] = [
      property('orange-east', 'orange', 16),
      { id: 'railroad', position: 5, name: 'Railroad', kind: 'railroad' },
      property('brown-south', 'brown', 3),
      property('brown-north', 'brown', 1),
    ]

    expect(getPropertiesInGroup(spaces, 'brown').map(({ id }) => id)).toEqual([
      'brown-south',
      'brown-north',
    ])
  })

  it('recognizes a complete set only when it has the group’s required property count', () => {
    const spaces: BoardSpace[] = [
      property('brown-one', 'brown', 1),
      property('brown-two', 'brown', 3),
      property('light-blue-one', 'light-blue', 6),
      property('light-blue-two', 'light-blue', 8),
      property('orange-one', 'orange', 16),
      property('orange-two', 'orange', 18),
      property('orange-three', 'orange', 19),
    ]

    expect(hasCompletePropertyGroup(spaces, 'brown')).toBe(true)
    expect(hasCompletePropertyGroup(spaces, 'light-blue')).toBe(false)
    expect(hasCompletePropertyGroup(spaces, 'orange')).toBe(true)
  })
})
