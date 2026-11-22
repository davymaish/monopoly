import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS } from './cards'
import type { CardDeckState } from './model'

export type CardRandomSource = () => number

export function shuffleCards<T>(
  cards: readonly T[],
  randomSource: CardRandomSource = Math.random,
): T[] {
  const shuffled = [...cards]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const sample = randomSource()
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new RangeError(
        `Random source must return a finite value in [0, 1); received ${sample}.`,
      )
    }

    const swapIndex = Math.floor(sample * (index + 1))
    const currentCard = shuffled[index]!
    shuffled[index] = shuffled[swapIndex]!
    shuffled[swapIndex] = currentCard
  }

  return shuffled
}

export function createShuffledDecks(randomSource: CardRandomSource = Math.random): CardDeckState {
  return {
    chance: shuffleCards(
      CHANCE_CARDS.map(({ id }) => id),
      randomSource,
    ),
    communityChest: shuffleCards(
      COMMUNITY_CHEST_CARDS.map(({ id }) => id),
      randomSource,
    ),
  }
}
