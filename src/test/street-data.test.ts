import { describe, expect, it } from 'vitest'
import type { PropertyGroup } from '../game/board-space'
import { getPropertiesInGroup, PROPERTY_GROUPS } from '../game/property-groups'
import { STREET_PROPERTIES } from '../game/street-data'

const expectedStreetNames = [
  'Mediterranean Avenue',
  'Baltic Avenue',
  'Oriental Avenue',
  'Vermont Avenue',
  'Connecticut Avenue',
  'St. Charles Place',
  'States Avenue',
  'Virginia Avenue',
  'St. James Place',
  'Tennessee Avenue',
  'New York Avenue',
  'Kentucky Avenue',
  'Indiana Avenue',
  'Illinois Avenue',
  'Atlantic Avenue',
  'Ventnor Avenue',
  'Marvin Gardens',
  'Pacific Avenue',
  'North Carolina Avenue',
  'Pennsylvania Avenue',
  'Park Place',
  'Boardwalk',
]

const expectedPositions = [
  1, 3, 6, 8, 9, 11, 13, 14, 16, 18, 19, 21, 23, 24, 26, 27, 29, 31, 32, 34, 37, 39,
]
const houseCostByGroup: Record<PropertyGroup, number> = {
  brown: 50,
  'light-blue': 50,
  pink: 100,
  orange: 100,
  red: 150,
  yellow: 150,
  green: 200,
  'dark-blue': 200,
}

describe('street property data', () => {
  it('contains all 22 classic streets in board order with unique identifiers and positions', () => {
    expect(STREET_PROPERTIES).toHaveLength(22)
    expect(STREET_PROPERTIES.map(({ name }) => name)).toEqual(expectedStreetNames)
    expect(STREET_PROPERTIES.map(({ position }) => position)).toEqual(expectedPositions)
    expect(new Set(STREET_PROPERTIES.map(({ id }) => id)).size).toBe(22)
  })

  it('contains complete prices, mortgages, group-specific building costs, and rent schedules', () => {
    for (const property of STREET_PROPERTIES) {
      expect(property.kind).toBe('property')
      expect(property.purchasePrice).toBeGreaterThan(0)
      expect(property.mortgageValue).toBe(property.purchasePrice / 2)
      expect(property.houseCost).toBe(houseCostByGroup[property.group])
      expect(property.rents.completeGroup).toBe(property.rents.base * 2)
      expect(property.rents.houses).toHaveLength(4)
      expect(property.rents.houses.every((rent) => rent > 0)).toBe(true)
      expect(property.rents.hotel).toBeGreaterThan(property.rents.houses[3])
    }

    expect(STREET_PROPERTIES[0]?.rents.houses).toEqual([10, 30, 90, 160])
    expect(STREET_PROPERTIES[21]?.rents).toEqual({
      base: 50,
      completeGroup: 100,
      houses: [200, 600, 1400, 1700],
      hotel: 2000,
    })
  })

  it('matches each color group’s defined membership count', () => {
    for (const group of Object.keys(PROPERTY_GROUPS) as PropertyGroup[]) {
      expect(getPropertiesInGroup(STREET_PROPERTIES, group)).toHaveLength(
        PROPERTY_GROUPS[group].propertyCount,
      )
    }
  })
})
