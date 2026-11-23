import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/initial-state'
import TurnSummary from '../components/TurnSummary'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

describe('TurnSummary', () => {
  it('describes backward movement in the recent activity log', () => {
    const initialState = createInitialGameState(setup)
    const gameState = {
      ...initialState,
      log: [
        {
          id: 'log-1',
          event: {
            type: 'movement' as const,
            playerId: 'player-1',
            from: 7,
            to: 4,
            spacesMoved: -3,
          },
        },
      ],
    }

    render(
      <TurnSummary
        gameState={gameState}
        onRollDice={() => {}}
        onMovePlayer={() => {}}
        onEndTurn={() => {}}
        onDrawCard={() => {}}
        onCompleteCard={() => {}}
      />,
    )

    expect(screen.getByText('Alex moved back 3 spaces to Income Tax.')).toBeInTheDocument()
  })
})
