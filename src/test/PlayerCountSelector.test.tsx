import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PlayerCountSelector, { isPlayerCount } from '../components/PlayerCountSelector'

describe('PlayerCountSelector', () => {
  it('offers only 2, 3, and 4 player choices and marks the current choice', () => {
    render(<PlayerCountSelector playerCount={3} onPlayerCountChange={vi.fn()} />)

    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('radio', { name: '2 players' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: '3 players' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '4 players' })).not.toBeChecked()
  })

  it('reports a supported count when a choice is selected', () => {
    const onPlayerCountChange = vi.fn()
    render(<PlayerCountSelector playerCount={2} onPlayerCountChange={onPlayerCountChange} />)

    fireEvent.click(screen.getByRole('radio', { name: '4 players' }))

    expect(onPlayerCountChange).toHaveBeenCalledWith(4)
  })

  it('validates counts against the supported player range', () => {
    expect(isPlayerCount(2)).toBe(true)
    expect(isPlayerCount(3)).toBe(true)
    expect(isPlayerCount(4)).toBe(true)
    expect(isPlayerCount(1)).toBe(false)
    expect(isPlayerCount(5)).toBe(false)
  })
})
