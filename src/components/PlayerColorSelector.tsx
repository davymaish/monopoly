import type { ChangeEvent, ReactElement } from 'react'
import type { PlayerCount } from '../setup/config'

export const PLAYER_TOKEN_COLORS = [
  { id: 'red', name: 'Red', hex: '#a52832' },
  { id: 'blue', name: 'Blue', hex: '#1d4ed8' },
  { id: 'green', name: 'Green', hex: '#147a48' },
  { id: 'purple', name: 'Purple', hex: '#6d3c91' },
  { id: 'orange', name: 'Orange', hex: '#b65c00' },
  { id: 'teal', name: 'Teal', hex: '#087e8b' },
  { id: 'gold', name: 'Gold', hex: '#886000' },
  { id: 'charcoal', name: 'Charcoal', hex: '#333333' },
] as const

export type PlayerColor = (typeof PLAYER_TOKEN_COLORS)[number]['id']

const DEFAULT_PLAYER_COLORS: readonly PlayerColor[] = ['red', 'blue', 'green', 'purple']

export function isPlayerColor(value: string): value is PlayerColor {
  return PLAYER_TOKEN_COLORS.some((color) => color.id === value)
}

interface PlayerColorSelectorProps {
  playerCount: PlayerCount
  playerColors: readonly PlayerColor[]
  onPlayerColorChange: (index: number, color: PlayerColor) => void
  fieldErrors?: readonly (string | null)[]
}

export default function PlayerColorSelector({
  playerCount,
  playerColors,
  onPlayerColorChange,
  fieldErrors = [],
}: PlayerColorSelectorProps): ReactElement {
  function handleChange(index: number, event: ChangeEvent<HTMLSelectElement>) {
    const nextColor = event.currentTarget.value

    if (
      isPlayerColor(nextColor) &&
      !playerColors.some((color, colorIndex) => colorIndex !== index && color === nextColor)
    ) {
      onPlayerColorChange(index, nextColor)
    }
  }

  return (
    <fieldset className="player-color-fields" aria-describedby="player-color-help">
      <legend className="player-color-legend">Token colors</legend>
      <p className="player-color-help" id="player-color-help">
        Give each player a distinct color; the color name is shown with its swatch.
      </p>
      <div className="player-color-grid">
        {Array.from({ length: playerCount }, (_, index) => {
          const selectedColor = playerColors[index] ?? DEFAULT_PLAYER_COLORS[index]
          const selectedOption = PLAYER_TOKEN_COLORS.find((color) => color.id === selectedColor)
          const colorsUsedByOthers = new Set(
            playerColors.filter((_, colorIndex) => colorIndex !== index),
          )

          return (
            <label className="player-color-field" key={index}>
              <span>Player {index + 1} token color</span>
              <span className="player-color-control">
                <select
                  aria-describedby={
                    fieldErrors[index]
                      ? `player-color-help player-color-error-${index}`
                      : 'player-color-help'
                  }
                  aria-invalid={fieldErrors[index] ? 'true' : undefined}
                  onChange={(event) => handleChange(index, event)}
                  value={selectedColor}
                >
                  {PLAYER_TOKEN_COLORS.map((color) => (
                    <option
                      disabled={colorsUsedByOthers.has(color.id)}
                      key={color.id}
                      value={color.id}
                    >
                      {color.name}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden="true"
                  className="player-color-swatch"
                  style={{ backgroundColor: selectedOption?.hex ?? 'transparent' }}
                />
              </span>
              {fieldErrors[index] && (
                <span className="setup-field-error" id={`player-color-error-${index}`}>
                  {fieldErrors[index]}
                </span>
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
