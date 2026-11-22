import { useState, type ReactElement } from 'react'
import BoardPerimeter from './components/BoardPerimeter'
import PropertyDetailCard from './components/PropertyDetailCard'
import type { PropertyDeed } from './components/PropertyDetailCard'
import PlayerCountSelector from './components/PlayerCountSelector'
import type { PlayerCount } from './components/PlayerCountSelector'

export default function App(): ReactElement {
  const [selectedDeed, setSelectedDeed] = useState<PropertyDeed | null>(null)
  const [playerCount, setPlayerCount] = useState<PlayerCount>(2)

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
          <PlayerCountSelector playerCount={playerCount} onPlayerCountChange={setPlayerCount} />
        </section>
        <BoardPerimeter onSelectDeed={setSelectedDeed} selectedDeedId={selectedDeed?.id ?? null} />
        <PropertyDetailCard property={selectedDeed} />
      </main>
    </div>
  )
}
