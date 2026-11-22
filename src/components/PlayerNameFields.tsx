import type { ChangeEvent, ReactElement } from 'react'
import type { PlayerCount } from './PlayerCountSelector'

export const MAX_PLAYER_NAME_LENGTH = 20

export function normalizePlayerNames(
  playerNames: readonly string[],
  playerCount: PlayerCount,
): string[] {
  const usedNames = new Set<string>()

  return Array.from({ length: playerCount }, (_, index) => {
    const enteredName = playerNames[index]?.trim().slice(0, MAX_PLAYER_NAME_LENGTH) ?? ''
    const baseName = enteredName || `Player ${index + 1}`
    let name = baseName
    let suffixNumber = 2

    while (usedNames.has(name.toLowerCase())) {
      const suffix = ` (${suffixNumber})`
      const prefix = baseName.slice(0, MAX_PLAYER_NAME_LENGTH - suffix.length).trimEnd()
      name = `${prefix}${suffix}`
      suffixNumber += 1
    }

    usedNames.add(name.toLowerCase())
    return name
  })
}

interface PlayerNameFieldsProps {
  playerCount: PlayerCount
  playerNames: readonly string[]
  onPlayerNameChange: (index: number, name: string) => void
  onNormalizeNames: () => void
}

export default function PlayerNameFields({
  playerCount,
  playerNames,
  onPlayerNameChange,
  onNormalizeNames,
}: PlayerNameFieldsProps): ReactElement {
  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    onPlayerNameChange(index, event.currentTarget.value.slice(0, MAX_PLAYER_NAME_LENGTH))
  }

  return (
    <fieldset className="player-name-fields">
      <legend className="player-name-legend">Player names</legend>
      <p className="player-name-help" id="player-name-help">
        Names are trimmed when you leave a field, blank names use a player-number default, and names
        are limited to {MAX_PLAYER_NAME_LENGTH} characters.
      </p>
      <div className="player-name-grid">
        {Array.from({ length: playerCount }, (_, index) => (
          <label className="player-name-field" key={index}>
            <span>Player {index + 1} name</span>
            <input
              aria-describedby="player-name-help"
              maxLength={MAX_PLAYER_NAME_LENGTH}
              onBlur={onNormalizeNames}
              onChange={(event) => handleChange(index, event)}
              type="text"
              value={playerNames[index] ?? ''}
            />
          </label>
        ))}
      </div>
    </fieldset>
  )
}
