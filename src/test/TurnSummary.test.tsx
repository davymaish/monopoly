import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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

  it('presents the card instruction and requires Continue before ending the turn', () => {
    const initialState = createInitialGameState(setup)
    const gameState = {
      ...initialState,
      pendingCard: { deck: 'chance' as const, cardId: 'chance-poor-tax', playerId: 'player-1' },
      phase: 'awaiting-player-action' as const,
    }
    const onCompleteCard = vi.fn()

    render(
      <TurnSummary
        gameState={gameState}
        onRollDice={() => {}}
        onMovePlayer={() => {}}
        onEndTurn={() => {}}
        onDrawCard={() => {}}
        onCompleteCard={onCompleteCard}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Pay poor tax of $15.')
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'End turn' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onCompleteCard).toHaveBeenCalledTimes(1)
  })

  it('announces doubles and offers Roll again after the landing is resolved', () => {
    const initialState = createInitialGameState(setup)
    const gameState = {
      ...initialState,
      extraRollAvailable: true,
      phase: 'awaiting-player-action' as const,
    }
    const onEndTurn = vi.fn()

    render(
      <TurnSummary
        gameState={gameState}
        onRollDice={() => {}}
        onMovePlayer={() => {}}
        onEndTurn={onEndTurn}
        onDrawCard={() => {}}
        onCompleteCard={() => {}}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Doubles! Resolve this space, then roll again.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Roll again' }))
    expect(onEndTurn).toHaveBeenCalledTimes(1)
  })

  it('shows legal Jail choices instead of ordinary roll and movement controls', () => {
    const initialState = createInitialGameState(setup)
    const onRollJailAttempt = vi.fn()
    const onPayJailBail = vi.fn()
    const gameState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0
          ? { ...player, position: 10, isInJail: true, getOutOfJailFreeCardCount: 1 }
          : player,
      ),
      phase: 'awaiting-roll' as const,
    }

    render(
      <TurnSummary
        gameState={gameState}
        onRollDice={() => {}}
        onRollJailAttempt={onRollJailAttempt}
        onPayJailBail={onPayJailBail}
        onMovePlayer={() => {}}
        onEndTurn={() => {}}
        onDrawCard={() => {}}
        onCompleteCard={() => {}}
      />,
    )

    const jailChoices = screen.getByRole('region', { name: 'Jail turn choices' })
    expect(jailChoices).toHaveTextContent('Attempt to roll doubles.')
    expect(jailChoices).toHaveTextContent('Pay $50 bail.')
    expect(jailChoices).toHaveTextContent('Use a Get Out of Jail Free card.')
    fireEvent.click(screen.getByRole('button', { name: 'Attempt to roll doubles' }))
    expect(onRollJailAttempt).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Pay $50 bail' }))
    expect(onPayJailBail).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Roll dice' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Complete movement' })).not.toBeInTheDocument()
  })

  it('blocks turn controls while an unaffordable bail is pending debt resolution', () => {
    const initialState = createInitialGameState(setup)
    const gameState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 10, cash: 40, isInJail: true } : player,
      ),
      debtResolution: {
        debtorId: 'player-1',
        creditorId: null,
        amount: 50,
        reason: 'jail-bail' as const,
      },
      phase: 'awaiting-player-action' as const,
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

    expect(screen.getByRole('status')).toHaveTextContent(
      'The $50 bail exceeds available cash. Resolve this debt before taking another action.',
    )
    expect(screen.queryByRole('button', { name: 'Pay $50 bail' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Attempt to roll doubles' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'End turn' })).not.toBeInTheDocument()
  })
})
