import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PlayerNameFields, {
  MAX_PLAYER_NAME_LENGTH,
  normalizePlayerNames,
} from '../components/PlayerNameFields'

describe('PlayerNameFields', () => {
  it('shows one labelled input for each active player', () => {
    render(
      <PlayerNameFields
        playerCount={3}
        playerNames={['Alex', 'Jordan', 'Sam']}
        onPlayerNameChange={vi.fn()}
        onNormalizeNames={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('textbox')).toHaveLength(3)
    expect(screen.getByRole('textbox', { name: 'Player 2 name' })).toHaveValue('Jordan')
  })

  it('limits edited names and normalizes the full list when a field is left', () => {
    const onPlayerNameChange = vi.fn()
    const onNormalizeNames = vi.fn()
    render(
      <PlayerNameFields
        playerCount={2}
        playerNames={['Player 1', 'Player 2']}
        onPlayerNameChange={onPlayerNameChange}
        onNormalizeNames={onNormalizeNames}
      />,
    )

    const input = screen.getByRole('textbox', { name: 'Player 1 name' })
    const longName = 'A'.repeat(MAX_PLAYER_NAME_LENGTH + 5)
    fireEvent.change(input, { target: { value: longName } })
    fireEvent.blur(input)

    expect(input).toHaveAttribute('maxlength', String(MAX_PLAYER_NAME_LENGTH))
    expect(onPlayerNameChange).toHaveBeenCalledWith(0, longName.slice(0, MAX_PLAYER_NAME_LENGTH))
    expect(onNormalizeNames).toHaveBeenCalledOnce()
  })

  it('trims names, fills blanks, truncates long names, and disambiguates duplicates', () => {
    const normalized = normalizePlayerNames(
      ['  Alex  ', 'alex', 'B'.repeat(MAX_PLAYER_NAME_LENGTH + 4), '   '],
      4,
    )

    expect(normalized).toEqual(['Alex', 'alex (2)', 'B'.repeat(MAX_PLAYER_NAME_LENGTH), 'Player 4'])
    expect(new Set(normalized.map((name) => name.toLowerCase())).size).toBe(4)
  })
})
