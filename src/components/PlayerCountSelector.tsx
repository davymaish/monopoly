import type { ChangeEvent, ReactElement } from 'react'
import { isPlayerCount, PLAYER_COUNTS } from '../setup/config'
import type { PlayerCount } from '../setup/config'

export { isPlayerCount } from '../setup/config'
export type { PlayerCount } from '../setup/config'

interface PlayerCountSelectorProps {
  playerCount: PlayerCount
  onPlayerCountChange: (playerCount: PlayerCount) => void
  errorMessage?: string | null
}

export default function PlayerCountSelector({
  playerCount,
  onPlayerCountChange,
  errorMessage,
}: PlayerCountSelectorProps): ReactElement {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextCount = Number(event.currentTarget.value)

    if (isPlayerCount(nextCount)) {
      onPlayerCountChange(nextCount)
    }
  }

  return (
    <fieldset
      aria-describedby={errorMessage ? 'player-count-help player-count-error' : 'player-count-help'}
      aria-invalid={errorMessage ? 'true' : undefined}
      className="player-count-selector"
    >
      <legend className="player-count-legend">Number of players</legend>
      <p className="player-count-help" id="player-count-help">
        Choose 2, 3, or 4 players for local pass-and-play.
      </p>
      {errorMessage && (
        <p className="setup-field-error" id="player-count-error">
          {errorMessage}
        </p>
      )}
      <div className="player-count-options">
        {PLAYER_COUNTS.map((count) => (
          <label
            className={`player-count-option${playerCount === count ? ' player-count-option--selected' : ''}`}
            key={count}
          >
            <input
              checked={playerCount === count}
              name="player-count"
              onChange={handleChange}
              type="radio"
              value={count}
            />
            <span>{count} players</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
