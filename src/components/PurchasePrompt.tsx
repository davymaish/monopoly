import type { ReactElement } from 'react'
import type { GameState } from '../game/model'
import { getPurchasableDeedById } from '../game/purchasable'

interface PurchasePromptProps {
  gameState: GameState
  onBuyProperty: (propertyId: string) => void
  onDeclinePurchase: (propertyId: string) => void
}

function formatCash(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

export default function PurchasePrompt({
  gameState,
  onBuyProperty,
  onDeclinePurchase,
}: PurchasePromptProps): ReactElement | null {
  const resolution = gameState.landingResolution
  if (resolution?.type !== 'unowned-property') {
    return null
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const deed = getPurchasableDeedById(resolution.spaceId)
  if (!currentPlayer || !deed) {
    return (
      <section className="purchase-prompt" aria-labelledby="purchase-prompt-heading">
        <h3 id="purchase-prompt-heading">Property purchase</h3>
        <p role="alert">Purchase details are unavailable. Decline this offer to continue.</p>
        <button
          className="purchase-prompt-button purchase-prompt-button--secondary"
          onClick={() => onDeclinePurchase(resolution.spaceId)}
          type="button"
        >
          Decline purchase
        </button>
      </section>
    )
  }

  const canAfford = currentPlayer.cash >= deed.purchasePrice

  return (
    <section className="purchase-prompt" aria-labelledby="purchase-prompt-heading">
      <h3 id="purchase-prompt-heading">Property purchase</h3>
      <p>
        <strong>{deed.name}</strong> is unowned and costs {formatCash(deed.purchasePrice)}.
      </p>
      <p>Your balance: {formatCash(currentPlayer.cash)}.</p>
      {!canAfford && (
        <p className="purchase-prompt-unaffordable" role="status">
          You do not have enough cash to buy this property.
        </p>
      )}
      <div className="purchase-prompt-actions">
        <button
          className="purchase-prompt-button"
          disabled={!canAfford}
          onClick={() => onBuyProperty(deed.id)}
          type="button"
        >
          Buy {deed.name} for {formatCash(deed.purchasePrice)}
        </button>
        <button
          className="purchase-prompt-button purchase-prompt-button--secondary"
          onClick={() => onDeclinePurchase(deed.id)}
          type="button"
        >
          Decline purchase
        </button>
      </div>
    </section>
  )
}
