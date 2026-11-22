import type { DiceRoll, DieValue } from './model'

function rollDie(randomSource: () => number): DieValue {
  const sample = randomSource()

  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
    throw new RangeError(`Random source must return a finite value in [0, 1); received ${sample}.`)
  }

  return (Math.floor(sample * 6) + 1) as DieValue
}

export function rollDice(randomSource: () => number = Math.random): DiceRoll {
  return [rollDie(randomSource), rollDie(randomSource)]
}
