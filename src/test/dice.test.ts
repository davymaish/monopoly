import { describe, expect, it, vi } from 'vitest'
import { rollDice } from '../game/dice'

describe('rollDice', () => {
  it('uses the injected source twice and produces deterministic values from one to six', () => {
    const samples = [0, 0.2, 0.4, 0.5, 0.7, 0.9, 0.999999]
    const randomSource = vi.fn(() => samples.shift() ?? 0)

    expect(rollDice(randomSource)).toEqual([1, 2])
    expect(rollDice(randomSource)).toEqual([3, 4])
    expect(rollDice(randomSource)).toEqual([5, 6])
    expect(randomSource).toHaveBeenCalledTimes(6)
    expect(rollDice(() => 0.999999)).toEqual([6, 6])
  })

  it('uses Math.random as the production default source', () => {
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValueOnce(0).mockReturnValueOnce(0.999999)

    try {
      expect(rollDice()).toEqual([1, 6])
      expect(randomSpy).toHaveBeenCalledTimes(2)
    } finally {
      randomSpy.mockRestore()
    }
  })

  it.each([-0.001, 1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects an invalid random sample (%s)',
    (sample) => {
      expect(() => rollDice(() => sample)).toThrow(RangeError)
    },
  )
})
