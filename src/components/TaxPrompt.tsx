import type { ReactElement } from 'react'
import type { TaxPaymentChoice, GameState } from '../game/model'
import {
  calculateTaxAmount,
  calculateTaxableWorth,
  INCOME_TAX_FIXED_AMOUNT,
  LUXURY_TAX_AMOUNT,
} from '../game/tax'

interface TaxPromptProps {
  gameState: GameState
  onPayTax: (choice: TaxPaymentChoice) => void
}

function formatCash(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

export default function TaxPrompt({ gameState, onPayTax }: TaxPromptProps): ReactElement | null {
  const resolution = gameState.landingResolution
  if (resolution?.type !== 'tax') {
    return null
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  if (!currentPlayer) {
    return (
      <section className="purchase-prompt" role="alert" aria-label="Tax payment">
        Tax payment details are unavailable.
      </section>
    )
  }

  if (resolution.tax === 'luxury') {
    return (
      <section className="purchase-prompt" aria-labelledby="tax-prompt-heading">
        <h3 id="tax-prompt-heading">Luxury Tax</h3>
        <p>
          {currentPlayer.name} must pay {formatCash(LUXURY_TAX_AMOUNT)} to the bank.
        </p>
        <div className="purchase-prompt-actions">
          <button
            className="purchase-prompt-button"
            onClick={() => onPayTax('fixed')}
            type="button"
          >
            Pay {formatCash(LUXURY_TAX_AMOUNT)} luxury tax
          </button>
        </div>
      </section>
    )
  }

  const taxableWorth = calculateTaxableWorth(gameState, currentPlayer.id)
  const percentageAmount = calculateTaxAmount(gameState, currentPlayer.id, 'income', 'percentage')

  return (
    <section className="purchase-prompt" aria-labelledby="tax-prompt-heading">
      <h3 id="tax-prompt-heading">Income Tax</h3>
      <p>
        {currentPlayer.name} may pay {formatCash(INCOME_TAX_FIXED_AMOUNT)} or 10% of total worth.
      </p>
      <p>
        Total worth: {formatCash(taxableWorth)} (cash plus the printed purchase prices of owned
        street, railroad, and utility deeds).
      </p>
      <div className="purchase-prompt-actions">
        <button className="purchase-prompt-button" onClick={() => onPayTax('fixed')} type="button">
          Pay {formatCash(INCOME_TAX_FIXED_AMOUNT)} income tax
        </button>
        <button
          className="purchase-prompt-button purchase-prompt-button--secondary"
          onClick={() => onPayTax('percentage')}
          type="button"
        >
          Pay {formatCash(percentageAmount ?? 0)} (10% of total worth)
        </button>
      </div>
    </section>
  )
}
