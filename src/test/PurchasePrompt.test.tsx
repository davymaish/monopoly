import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PurchasePrompt from '../components/PurchasePrompt'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'

function createPurchaseOffer(cash: number): GameState {
  const initialState = createInitialGameState({
    playerCount: 2,
    playerNames: ['Alex', 'Jordan'],
    playerColors: ['red', 'blue'],
  })

  return {
    ...initialState,
    players: initialState.players.map((player, index) =>
      index === 0 ? { ...player, cash } : player,
    ),
    landingResolution: {
      type: 'unowned-property',
      spaceId: 'mediterranean-avenue',
      spaceName: 'Mediterranean Avenue',
      legalActions: ['buy-property', 'decline-purchase'],
    },
  }
}

describe('PurchasePrompt', () => {
  it('shows the deed price and disables buying when the active player cannot afford it', () => {
    render(
      <PurchasePrompt
        gameState={createPurchaseOffer(50)}
        onBuyProperty={vi.fn()}
        onDeclinePurchase={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Property purchase' })).toBeInTheDocument()
    expect(screen.getByText('Mediterranean Avenue')).toBeInTheDocument()
    expect(screen.getByText(/costs \$60/)).toBeInTheDocument()
    expect(screen.getByText('Your balance: $50.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('do not have enough cash')
    expect(screen.getByRole('button', { name: 'Buy Mediterranean Avenue for $60' })).toBeDisabled()
  })

  it('routes affordable buy and decline choices to their matching property IDs', () => {
    const onBuyProperty = vi.fn()
    const onDeclinePurchase = vi.fn()
    const { rerender } = render(
      <PurchasePrompt
        gameState={createPurchaseOffer(1500)}
        onBuyProperty={onBuyProperty}
        onDeclinePurchase={onDeclinePurchase}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Buy Mediterranean Avenue for $60' }))
    expect(onBuyProperty).toHaveBeenCalledWith('mediterranean-avenue')

    rerender(
      <PurchasePrompt
        gameState={createPurchaseOffer(1500)}
        onBuyProperty={onBuyProperty}
        onDeclinePurchase={onDeclinePurchase}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Decline purchase' }))
    expect(onDeclinePurchase).toHaveBeenCalledWith('mediterranean-avenue')
  })
})
