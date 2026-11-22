import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import RollDiceControl from '../components/RollDiceControl'

describe('RollDiceControl', () => {
  it('enables rolling while awaiting a roll and disables it during resolution', () => {
    const onRollDice = vi.fn()
    const { rerender } = render(<RollDiceControl onRollDice={onRollDice} phase="awaiting-roll" />)
    const rollButton = screen.getByRole('button', { name: 'Roll dice' })

    expect(rollButton).toBeEnabled()
    fireEvent.click(rollButton)
    expect(onRollDice).toHaveBeenCalledOnce()

    rerender(<RollDiceControl onRollDice={onRollDice} phase="resolving-turn" />)

    expect(rollButton).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Dice rolled. Movement resolution is pending.',
    )
  })

  it('does not allow rolling during another non-roll phase', () => {
    render(<RollDiceControl onRollDice={vi.fn()} phase="awaiting-player-action" />)

    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDisabled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
