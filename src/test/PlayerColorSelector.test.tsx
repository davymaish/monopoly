import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PlayerColorSelector, {
  isPlayerColor,
  PLAYER_TOKEN_COLORS,
} from '../components/PlayerColorSelector'

describe('PlayerColorSelector', () => {
  it('offers readable named choices for each active player', () => {
    render(
      <PlayerColorSelector
        playerCount={3}
        playerColors={['red', 'blue', 'green', 'purple']}
        onPlayerColorChange={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('combobox')).toHaveLength(3)
    expect(screen.getByRole('combobox', { name: 'Player 1 token color' })).toHaveValue('red')
    expect(
      within(screen.getByRole('combobox', { name: 'Player 1 token color' })).getByRole('option', {
        name: 'Blue',
      }),
    ).toBeDisabled()
    expect(PLAYER_TOKEN_COLORS).toHaveLength(8)
  })

  it('reports a valid unused color change and ignores a duplicate', () => {
    const onPlayerColorChange = vi.fn()
    render(
      <PlayerColorSelector
        playerCount={2}
        playerColors={['red', 'blue', 'green', 'purple']}
        onPlayerColorChange={onPlayerColorChange}
      />,
    )

    const firstPlayerColor = screen.getByRole('combobox', { name: 'Player 1 token color' })
    fireEvent.change(firstPlayerColor, { target: { value: 'orange' } })
    expect(onPlayerColorChange).toHaveBeenCalledWith(0, 'orange')

    fireEvent.change(firstPlayerColor, { target: { value: 'blue' } })
    expect(onPlayerColorChange).toHaveBeenCalledOnce()
  })

  it('validates color identifiers against the palette', () => {
    expect(isPlayerColor('teal')).toBe(true)
    expect(isPlayerColor('not-a-color')).toBe(false)
  })
})
