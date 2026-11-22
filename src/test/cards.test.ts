import { describe, expect, it } from 'vitest'
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS } from '../game/cards'

describe('classic card decks', () => {
  it('contains sixteen uniquely identified typed cards in each deck', () => {
    expect(CHANCE_CARDS).toHaveLength(16)
    expect(COMMUNITY_CHEST_CARDS).toHaveLength(16)
    expect(new Set(CHANCE_CARDS.map(({ id }) => id)).size).toBe(16)
    expect(new Set(COMMUNITY_CHEST_CARDS.map(({ id }) => id)).size).toBe(16)
    expect(CHANCE_CARDS.map(({ id }) => id)).not.toEqual(COMMUNITY_CHEST_CARDS.map(({ id }) => id))

    expect(
      CHANCE_CARDS.find(({ id }) => id === 'chance-nearest-railroad-double-rent')?.effect,
    ).toEqual({ type: 'advance-to-nearest-railroad', rentMultiplier: 2, goSalary: 'if-passed' })
    expect(CHANCE_CARDS.find(({ id }) => id === 'chance-general-repairs')?.effect).toEqual({
      type: 'repairs',
      houseCost: 25,
      hotelCost: 100,
    })
    expect(
      COMMUNITY_CHEST_CARDS.find(({ id }) => id === 'community-chest-birthday')?.effect,
    ).toEqual({ type: 'collect-from-each-opponent', amount: 10 })
    expect(
      COMMUNITY_CHEST_CARDS.find(({ id }) => id === 'community-chest-street-repairs')?.effect,
    ).toEqual({
      type: 'repairs',
      houseCost: 40,
      hotelCost: 115,
    })
  })
})
