import { describe, expect, it } from 'vitest'
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS } from '../game/cards'
import { createShuffledDecks, shuffleCards } from '../game/card-shuffle'

describe('card deck shuffling', () => {
  it('shuffles both decks deterministically with injected randomness and retains every card once', () => {
    const firstDecks = createShuffledDecks(() => 0.5)
    const secondDecks = createShuffledDecks(() => 0.5)

    expect(firstDecks).toEqual(secondDecks)
    expect(firstDecks.chance).toHaveLength(16)
    expect(firstDecks.communityChest).toHaveLength(16)
    expect(new Set(firstDecks.chance).size).toBe(16)
    expect(new Set(firstDecks.communityChest).size).toBe(16)
    expect(new Set(firstDecks.chance)).toEqual(new Set(CHANCE_CARDS.map(({ id }) => id)))
    expect(new Set(firstDecks.communityChest)).toEqual(
      new Set(COMMUNITY_CHEST_CARDS.map(({ id }) => id)),
    )
  })

  it('does not mutate its input and rejects invalid random samples', () => {
    const cards = ['one', 'two', 'three', 'four']
    const shuffled = shuffleCards(cards, () => 0.5)

    expect(cards).toEqual(['one', 'two', 'three', 'four'])
    expect(shuffled).not.toBe(cards)
    expect([...shuffled].sort()).toEqual([...cards].sort())
    expect(() => shuffleCards(cards, () => 1)).toThrow(RangeError)
  })
})
