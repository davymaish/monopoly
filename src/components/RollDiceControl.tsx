import type { ReactElement } from 'react'
import type { GamePhase } from '../game/model'

interface RollDiceControlProps {
  onRollDice: () => void
  phase: GamePhase
}

export default function RollDiceControl({ onRollDice, phase }: RollDiceControlProps): ReactElement {
  const canRoll = phase === 'awaiting-roll'

  return (
    <section className="roll-dice-control" aria-label="Turn controls">
      <button className="roll-dice-button" disabled={!canRoll} onClick={onRollDice} type="button">
        Roll dice
      </button>
      {phase === 'resolving-turn' && (
        <p className="roll-dice-status" role="status">
          Dice rolled. Movement resolution is pending.
        </p>
      )}
    </section>
  )
}
