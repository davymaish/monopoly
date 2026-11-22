import { useState, type ReactElement } from 'react'
import BoardPerimeter from './components/BoardPerimeter'
import PropertyDetailCard from './components/PropertyDetailCard'
import type { PropertyDeed } from './components/PropertyDetailCard'
import PlayerCountSelector from './components/PlayerCountSelector'
import type { PlayerCount } from './components/PlayerCountSelector'
import PlayerNameFields, { normalizePlayerNames } from './components/PlayerNameFields'
import PlayerColorSelector, { PLAYER_TOKEN_COLORS } from './components/PlayerColorSelector'
import type { PlayerColor } from './components/PlayerColorSelector'
import { validateSetup } from './setup/validation'

export default function App(): ReactElement {
  const [selectedDeed, setSelectedDeed] = useState<PropertyDeed | null>(null)
  const [playerCount, setPlayerCount] = useState<PlayerCount>(2)
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4'])
  const [playerColors, setPlayerColors] = useState<PlayerColor[]>([
    'red',
    'blue',
    'green',
    'purple',
  ])

  function handlePlayerNameChange(index: number, name: string) {
    setPlayerNames((currentNames) =>
      currentNames.map((currentName, currentIndex) =>
        currentIndex === index ? name : currentName,
      ),
    )
  }

  function handleNormalizeNames() {
    setPlayerNames((currentNames) => [
      ...normalizePlayerNames(currentNames, playerCount),
      ...currentNames.slice(playerCount),
    ])
  }

  function handlePlayerColorChange(index: number, color: PlayerColor) {
    setPlayerColors((currentColors) =>
      currentColors.map((currentColor, currentIndex) =>
        currentIndex === index ? color : currentColor,
      ),
    )
  }

  const setupValidation = validateSetup({
    playerCount,
    playerNames,
    playerColors,
    availableColorIds: PLAYER_TOKEN_COLORS.map((color) => color.id),
  })

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-eyebrow">A classic game of chance and strategy</p>
        <h1 className="app-title">Monopoly</h1>
        <p className="app-subtitle">Local pass-and-play for 2–4 players</p>
      </header>
      <main className="app-main">
        <section className="setup-panel" aria-labelledby="setup-heading">
          <h2 id="setup-heading">Game setup</h2>
          <PlayerCountSelector
            playerCount={playerCount}
            onPlayerCountChange={setPlayerCount}
            errorMessage={setupValidation.playerCountError}
          />
          <PlayerNameFields
            playerCount={playerCount}
            playerNames={playerNames}
            onPlayerNameChange={handlePlayerNameChange}
            onNormalizeNames={handleNormalizeNames}
            fieldErrors={setupValidation.playerNameErrors}
          />
          <PlayerColorSelector
            playerCount={playerCount}
            playerColors={playerColors}
            onPlayerColorChange={handlePlayerColorChange}
            fieldErrors={setupValidation.playerColorErrors}
          />
          {setupValidation.isValid ? (
            <p className="setup-validation-success" role="status">
              Setup is valid.
            </p>
          ) : (
            <p className="setup-validation-error" role="alert">
              Resolve the highlighted setup fields before starting.
            </p>
          )}
        </section>
        <BoardPerimeter onSelectDeed={setSelectedDeed} selectedDeedId={selectedDeed?.id ?? null} />
        <PropertyDetailCard property={selectedDeed} />
      </main>
    </div>
  )
}
