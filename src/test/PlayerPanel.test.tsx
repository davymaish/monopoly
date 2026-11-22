import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PlayerPanel from '../components/PlayerPanel'
import { createInitialGameState } from '../game/initial-state'

describe('PlayerPanel', () => {
  it('displays player data and marks the active turn from game state', () => {
    const initialState = createInitialGameState({
      playerCount: 2,
      playerNames: ['Alex', 'Jordan'],
      playerColors: ['red', 'blue'],
    })
    const gameState = {
      ...initialState,
      currentPlayerIndex: 1,
      players: initialState.players.map((player, index) => ({
        ...player,
        cash: index === 0 ? 1200 : 1500,
      })),
    }

    render(<PlayerPanel gameState={gameState} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Players' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Alex' })).toBeInTheDocument()
    expect(screen.getByText('Red token')).toBeInTheDocument()
    expect(screen.getByText('$1,200')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Jordan' })).toBeInTheDocument()
    expect(screen.getByText('Blue token')).toBeInTheDocument()
    expect(screen.getByText('$1,500')).toBeInTheDocument()

    const players = screen.getAllByRole('listitem')
    expect(players[0]).not.toHaveAttribute('aria-current', 'true')
    expect(players[1]).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('Current turn')).toBeInTheDocument()
  })
})
