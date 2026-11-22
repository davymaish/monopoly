import type { ChangeEvent, ReactElement } from 'react'

const PLAYER_COUNTS = [2, 3, 4] as const

export type PlayerCount = (typeof PLAYER_COUNTS)[number]

export function isPlayerCount(value: number): value is PlayerCount {
  return PLAYER_COUNTS.some((count) => count === value)
}

interface PlayerCountSelectorProps {
  playerCount: PlayerCount
  onPlayerCountChange: (playerCount: PlayerCount) => void
}

export default function PlayerCountSelector({
  playerCount,
  onPlayerCountChange,
}: PlayerCountSelectorProps): ReactElement {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextCount = Number(event.currentTarget.value)

    if (isPlayerCount(nextCount)) {
      onPlayerCountChange(nextCount)
    }
  }

  return (
    <fieldset className="player-count-selector" aria-describedby="player-count-help">
      <legend className="player-count-legend">Number of players</legend>
      <p className="player-count-help" id="player-count-help">
        Choose 2, 3, or 4 players for local pass-and-play.
      </p>
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
