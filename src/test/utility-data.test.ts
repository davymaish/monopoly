import { describe, expect, it } from 'vitest'
import { calculateUtilityRent, UTILITY_RENT_MULTIPLIERS, UTILITIES } from '../game/utility-data'

describe('utility data', () => {
  it('defines Electric Company and Water Works with classic deed values', () => {
    expect(UTILITIES).toHaveLength(2)
    expect(UTILITIES.map(({ name }) => name)).toEqual(['Electric Company', 'Water Works'])
    expect(UTILITIES.map(({ position }) => position)).toEqual([12, 28])
    expect(new Set(UTILITIES.map(({ id }) => id)).size).toBe(2)

    for (const utility of UTILITIES) {
      expect(utility.kind).toBe('utility')
      expect(utility.purchasePrice).toBe(150)
      expect(utility.mortgageValue).toBe(75)
      expect(utility.rentMultipliers).toEqual({ oneUtility: 4, bothUtilities: 10 })
    }
  })

  it('calculates rent at four times one dice total or ten times for both utilities', () => {
    expect(UTILITY_RENT_MULTIPLIERS).toEqual({ oneUtility: 4, bothUtilities: 10 })
    expect([2, 7, 12].map((total) => calculateUtilityRent(total, 1))).toEqual([8, 28, 48])
    expect([2, 7, 12].map((total) => calculateUtilityRent(total, 2))).toEqual([20, 70, 120])
  })
})
