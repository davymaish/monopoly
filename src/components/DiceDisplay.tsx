import type { ReactElement } from 'react'
import type { DiceRoll } from '../game/model'

interface DiceDisplayProps {
  dice: DiceRoll | null
}

export default function DiceDisplay({ dice }: DiceDisplayProps): ReactElement {
  return (
    <section className="dice-display" aria-label="Dice result">
      <h3>Dice</h3>
      {dice ? (
        <div className="dice-roll-results" aria-atomic="true" aria-live="polite">
          <span className="die-face" role="img" aria-label={`First die shows ${dice[0]}`}>
            {dice[0]}
          </span>
          <span className="die-face" role="img" aria-label={`Second die shows ${dice[1]}`}>
            {dice[1]}
          </span>
          <p className="dice-total">
            <span>Total</span>
            <strong>{dice[0] + dice[1]}</strong>
          </p>
        </div>
      ) : (
        <p className="dice-empty" role="status">
          Roll the dice to see your result.
        </p>
      )}
    </section>
  )
}
