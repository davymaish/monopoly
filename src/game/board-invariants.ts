import type { BoardSpace, PropertyGroup } from './board-space'
import { PROPERTY_GROUPS } from './property-groups'

const EXPECTED_SPACE_COUNTS: Record<BoardSpace['kind'], number> = {
  property: 22,
  railroad: 4,
  utility: 2,
  tax: 2,
  card: 6,
  corner: 3,
  parking: 1,
}

const PROPERTY_GROUPS_LIST = Object.keys(PROPERTY_GROUPS) as PropertyGroup[]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function areFourPositiveNumbers(value: unknown): boolean {
  return Array.isArray(value) && value.length === 4 && value.every(isPositiveNumber)
}

function isOneOf(value: unknown, allowed: readonly string[]): boolean {
  return typeof value === 'string' && allowed.includes(value)
}

export function validateBoardData(spaces: readonly BoardSpace[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const positions = new Set<number>()
  const kindCounts: Record<string, number> = {}

  if (spaces.length !== 40) {
    errors.push(`Expected 40 board spaces, received ${spaces.length}.`)
  }

  for (const [index, space] of spaces.entries()) {
    const data = space as unknown as Record<string, unknown>
    const id = data.id
    const position = data.position
    const kind = data.kind

    if (typeof id !== 'string' || id.trim() === '') {
      errors.push(`Board space at index ${index} has no valid ID.`)
    } else if (ids.has(id)) {
      errors.push(`Duplicate board ID: ${id}.`)
    } else {
      ids.add(id)
    }

    if (
      typeof position !== 'number' ||
      !Number.isInteger(position) ||
      position < 0 ||
      position >= 40
    ) {
      errors.push(`Board space ${String(id)} has an invalid position.`)
    } else if (positions.has(position)) {
      errors.push(`Duplicate board position: ${position}.`)
    } else {
      positions.add(position)
    }

    if (typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push(`Board space ${String(id)} has no valid name.`)
    }

    if (
      typeof kind !== 'string' ||
      !Object.prototype.hasOwnProperty.call(EXPECTED_SPACE_COUNTS, kind)
    ) {
      errors.push(`Board space ${String(id)} has an invalid kind.`)
      continue
    }
    kindCounts[kind] = (kindCounts[kind] ?? 0) + 1

    switch (kind) {
      case 'property': {
        if (
          typeof data.group !== 'string' ||
          !Object.prototype.hasOwnProperty.call(PROPERTY_GROUPS, data.group)
        ) {
          errors.push(`Property ${String(id)} has an invalid group.`)
        }
        if (
          !isPositiveNumber(data.purchasePrice) ||
          !isPositiveNumber(data.mortgageValue) ||
          !isPositiveNumber(data.houseCost)
        ) {
          errors.push(
            `Property ${String(id)} is missing purchase, mortgage, or building-cost data.`,
          )
        }
        if (
          !isRecord(data.rents) ||
          !isPositiveNumber(data.rents.base) ||
          !isPositiveNumber(data.rents.completeGroup) ||
          !areFourPositiveNumbers(data.rents.houses) ||
          !isPositiveNumber(data.rents.hotel)
        ) {
          errors.push(`Property ${String(id)} has an incomplete rent schedule.`)
        }
        break
      }
      case 'railroad':
        if (
          !isPositiveNumber(data.purchasePrice) ||
          !isPositiveNumber(data.mortgageValue) ||
          !areFourPositiveNumbers(data.rentByRailroadsOwned)
        ) {
          errors.push(`Railroad ${String(id)} has incomplete deed data.`)
        }
        break
      case 'utility': {
        const multipliers = data.rentMultipliers
        if (
          !isPositiveNumber(data.purchasePrice) ||
          !isPositiveNumber(data.mortgageValue) ||
          !isRecord(multipliers) ||
          !isPositiveNumber(multipliers.oneUtility) ||
          !isPositiveNumber(multipliers.bothUtilities)
        ) {
          errors.push(`Utility ${String(id)} has incomplete deed or rent data.`)
        }
        break
      }
      case 'tax':
        if (!isOneOf(data.tax, ['income', 'luxury'])) {
          errors.push(`Tax space ${String(id)} has an invalid tax kind.`)
        }
        break
      case 'card':
        if (!isOneOf(data.deck, ['chance', 'community-chest'])) {
          errors.push(`Card space ${String(id)} has an invalid deck.`)
        }
        break
      case 'corner':
        if (!isOneOf(data.corner, ['go', 'jail', 'go-to-jail'])) {
          errors.push(`Corner space ${String(id)} has an invalid corner kind.`)
        }
        break
      case 'parking':
        break
    }
  }

  for (let position = 0; position < 40; position += 1) {
    if (!positions.has(position)) {
      errors.push(`Missing board position: ${position}.`)
    }
  }

  for (const [kind, expectedCount] of Object.entries(EXPECTED_SPACE_COUNTS)) {
    const actualCount = kindCounts[kind] ?? 0
    if (actualCount !== expectedCount) {
      errors.push(`Expected ${expectedCount} ${kind} spaces, received ${actualCount}.`)
    }
  }

  for (const group of PROPERTY_GROUPS_LIST) {
    const actualCount = spaces.filter(
      (space) => space.kind === 'property' && space.group === group,
    ).length
    const expectedCount = PROPERTY_GROUPS[group].propertyCount
    if (actualCount !== expectedCount) {
      errors.push(`Expected ${expectedCount} ${group} properties, received ${actualCount}.`)
    }
  }

  return errors
}
