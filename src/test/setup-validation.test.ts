import { describe, expect, it } from 'vitest'
import { validateSetup } from '../setup/validation'

const availableColorIds = ['red', 'blue', 'green']

describe('validateSetup', () => {
  it('accepts a supported count with complete, unique names and colors', () => {
    const result = validateSetup({
      playerCount: 2,
      playerNames: ['Alice', 'Jordan'],
      playerColors: ['red', 'blue'],
      availableColorIds,
    })

    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('reports an invalid player count and a missing player name', () => {
    const result = validateSetup({
      playerCount: 1,
      playerNames: ['   '],
      playerColors: ['red'],
      availableColorIds,
    })

    expect(result.isValid).toBe(false)
    expect(result.playerCountError).toBe('Choose 2, 3, or 4 players.')
    expect(result.playerNameErrors[0]).toBe('Enter a name for this player.')
  })

  it('reports missing setup values for every active player', () => {
    const result = validateSetup({
      playerCount: 2,
      playerNames: ['Alex'],
      playerColors: ['red'],
      availableColorIds,
    })

    expect(result.playerNameErrors).toEqual([null, 'Enter a name for this player.'])
    expect(result.playerColorErrors).toEqual([null, 'Choose a valid token color.'])
  })

  it('rejects overlong or duplicate names without changing their values', () => {
    const result = validateSetup({
      playerCount: 3,
      playerNames: ['Morgan', 'morgan', 'N'.repeat(21)],
      playerColors: ['red', 'blue', 'green'],
      availableColorIds,
    })

    expect(result.playerNameErrors).toEqual([
      null,
      'Player names must be unique.',
      'Names must be 20 characters or fewer.',
    ])
  })

  it('rejects unknown and duplicate token colors', () => {
    const result = validateSetup({
      playerCount: 3,
      playerNames: ['A', 'B', 'C'],
      playerColors: ['red', 'red', 'neon'],
      availableColorIds,
    })

    expect(result.playerColorErrors).toEqual([
      null,
      'Choose a token color not used by another player.',
      'Choose a valid token color.',
    ])
  })
})
