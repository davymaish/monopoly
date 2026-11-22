import { describe, expect, it } from 'vitest'
import { RAILROADS } from '../game/railroad-data'

describe('railroad data', () => {
  it('defines all four railroads in their classic board positions', () => {
    expect(RAILROADS).toHaveLength(4)
    expect(RAILROADS.map(({ name }) => name)).toEqual([
      'Reading Railroad',
      'Pennsylvania Railroad',
      'B. & O. Railroad',
      'Short Line Railroad',
    ])
    expect(RAILROADS.map(({ position }) => position)).toEqual([5, 15, 25, 35])
    expect(new Set(RAILROADS.map(({ id }) => id)).size).toBe(4)
  })

  it('records the classic purchase, mortgage, and rent schedule', () => {
    for (const railroad of RAILROADS) {
      expect(railroad.kind).toBe('railroad')
      expect(railroad.purchasePrice).toBe(200)
      expect(railroad.mortgageValue).toBe(100)
      expect(railroad.rentByRailroadsOwned).toEqual([25, 50, 100, 200])
    }
  })
})
