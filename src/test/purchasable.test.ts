import { describe, expect, it } from 'vitest'
import { getPurchasableDeedById } from '../game/purchasable'

describe('getPurchasableDeedById', () => {
  it('returns the existing purchase prices for each purchasable deed category', () => {
    expect(getPurchasableDeedById('mediterranean-avenue')).toMatchObject({
      purchasePrice: 60,
      mortgageValue: 30,
    })
    expect(getPurchasableDeedById('reading-railroad')).toMatchObject({
      purchasePrice: 200,
      mortgageValue: 100,
    })
    expect(getPurchasableDeedById('electric-company')).toMatchObject({
      purchasePrice: 150,
      mortgageValue: 75,
    })
  })

  it('returns no deed for non-purchasable or unknown IDs', () => {
    expect(getPurchasableDeedById('go')).toBeUndefined()
    expect(getPurchasableDeedById('unknown-property')).toBeUndefined()
  })
})
