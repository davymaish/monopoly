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
    const onUseJailFreeCard = vi.fn()
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
        onUseJailFreeCard={onUseJailFreeCard}
        onMovePlayer={() => {}}
        onEndTurn={() => {}}
        onDrawCard={() => {}}
        onCompleteCard={() => {}}
      />,
    )

    const jailChoices = screen.getByRole('region', { name: 'Jail turn choices' })
    expect(jailChoices).toHaveTextContent('Failed doubles attempts: 0 of 3.')
    expect(jailChoices).toHaveTextContent(
      'Choose how to leave Jail: attempt to roll doubles, pay $50 bail, or use a Get Out of Jail Free card.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Attempt to roll doubles' }))
    expect(onRollJailAttempt).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Pay $50 bail' }))
    expect(onPayJailBail).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Use Get Out of Jail Free card' }))
    expect(onUseJailFreeCard).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Roll dice' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Complete movement' })).not.toBeInTheDocument()
  })

  it('shows the final-attempt consequence and only the choices available to a jailed player', () => {
    const initialState = createInitialGameState(setup)
    const gameState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 10, isInJail: true, jailTurns: 2 } : player,
      ),
      phase: 'awaiting-roll' as const,
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

    expect(screen.getByText('Failed doubles attempts: 2 of 3.')).toBeInTheDocument()
    expect(screen.getByText(/third and final doubles attempt/i)).toHaveTextContent(
      'If you fail, pay $50 bail and move by this roll.',
    )
    expect(screen.getByRole('button', { name: 'Attempt to roll doubles' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pay $50 bail' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Use Get Out of Jail Free card' }),
    ).not.toBeInTheDocument()
  })

  it('distinguishes Just Visiting from Jail status by using the jailed-state flag', () => {
    const initialState = createInitialGameState(setup)
    const gameState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 10, isInJail: false, jailTurns: 2 } : player,
      ),
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

    expect(screen.queryByText('In Jail')).not.toBeInTheDocument()
    expect(screen.queryByText(/Failed doubles attempts:/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeInTheDocument()
  })

  it('blocks turn controls while an unaffordable bail is pending debt resolution', () => {
    const initialState = createInitialGameState(setup)
    const gameState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0
          ? { ...player, position: 10, cash: 40, isInJail: true, getOutOfJailFreeCardCount: 1 }
          : player,
      ),
      debtResolution: {
        debtorId: 'player-1',
        creditorId: null,
        amount: 50,
        reason: 'jail-bail' as const,
        resumeJailMovement: false,
      },
      phase: 'awaiting-player-action' as const,
    }
    const onUseJailFreeCard = vi.fn()

    render(
      <TurnSummary
        gameState={gameState}
        onRollDice={() => {}}
        onUseJailFreeCard={onUseJailFreeCard}
        onMovePlayer={() => {}}
        onEndTurn={() => {}}
        onDrawCard={() => {}}
        onCompleteCard={() => {}}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Alex owes $50 to the bank for jail bail. Available cash: $40. Use a Get Out of Jail Free card or sell buildings and mortgage eligible properties before paying.',
    )
    expect(
      screen.queryByRole('button', { name: 'Declare bankruptcy to the bank' }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Use Get Out of Jail Free card' }))
    expect(onUseJailFreeCard).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Pay $50 bail' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Attempt to roll doubles' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'End turn' })).not.toBeInTheDocument()
  })

  it('offers payment when a debt is affordable and hides dice and turn controls', () => {
    const initialState = createInitialGameState(setup)
    const gameState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, cash: 20 } : player,
      ),
      debtResolution: {
        debtorId: 'player-1',
        creditorId: 'player-2',
        amount: 10,
        reason: 'rent' as const,
        resumeJailMovement: false,
      },
      phase: 'awaiting-player-action' as const,
    }
    const onPayDebt = vi.fn()

    render(
      <TurnSummary
        gameState={gameState}
        onRollDice={() => {}}
        onPayDebt={onPayDebt}
        onMovePlayer={() => {}}
        onEndTurn={() => {}}
        onDrawCard={() => {}}
        onCompleteCard={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Pay $10 debt' }))
    expect(onPayDebt).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Roll dice' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'End turn' })).not.toBeInTheDocument()
  })

  it('offers bankruptcy to a player creditor and names them in the activity log', () => {
    const initialState = createInitialGameState(setup)
    const gameState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, cash: 10 } : player,
      ),
      ownership: {
        ...initialState.ownership,
        'mediterranean-avenue': 'player-1',
        'reading-railroad': 'player-1',
      },
      propertyBuildings: {
        ...initialState.propertyBuildings,
        'mediterranean-avenue': { houses: 1, hotels: 0 },
      },
      mortgagedProperties: ['reading-railroad'],
      debtResolution: {
        debtorId: 'player-1',
        creditorId: 'player-2',
        amount: 100,
        reason: 'rent' as const,
        resumeJailMovement: false,
      },
      phase: 'awaiting-player-action' as const,
      log: [
        {
          id: 'log-bankruptcy',
          event: { type: 'bankruptcy' as const, playerId: 'player-1', creditorId: 'player-2' },
        },
      ],
    }
    const onDeclareBankruptcy = vi.fn()

    render(
      <TurnSummary
        gameState={gameState}
        onRollDice={() => {}}
        onDeclareBankruptcy={onDeclareBankruptcy}
        onMovePlayer={() => {}}
        onEndTurn={() => {}}
        onDrawCard={() => {}}
        onCompleteCard={() => {}}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Alex owes $100 to Jordan for rent. Available cash: $10. No legal building sales or mortgages remain.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Declare bankruptcy to Jordan' }))
    expect(onDeclareBankruptcy).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Alex went bankrupt to Jordan.')).toBeInTheDocument()
  })

  it('offers bank bankruptcy only after no legal remedies remain', () => {
    const initialState = createInitialGameState(setup)
    const gameState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, cash: 0 } : player,
      ),
      debtResolution: {
        debtorId: 'player-1',
        creditorId: null,
        amount: 100,
        reason: 'tax' as const,
        resumeJailMovement: false,
      },
      phase: 'awaiting-player-action' as const,
    }
    const onDeclareBankruptcy = vi.fn()

    render(
      <TurnSummary
        gameState={gameState}
        onRollDice={() => {}}
        onDeclareBankruptcy={onDeclareBankruptcy}
        onMovePlayer={() => {}}
        onEndTurn={() => {}}
        onDrawCard={() => {}}
        onCompleteCard={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Declare bankruptcy to the bank' }))
    expect(onDeclareBankruptcy).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent(
      'No legal building sales or mortgages remain.',
    )
  })
})
