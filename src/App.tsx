import type { ReactElement } from 'react'

export default function App(): ReactElement {
  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-eyebrow">A classic game of chance and strategy</p>
        <h1 className="app-title">Monopoly</h1>
        <p className="app-subtitle">Local pass-and-play for 2–4 players</p>
      </header>
      <main className="app-main">
        <section className="app-card" aria-labelledby="game-status-title">
          <h2 id="game-status-title">The game is coming together.</h2>
          <p>Game interface is being built.</p>
          <p>Setup and the board will arrive in the next update.</p>
        </section>
      </main>
    </div>
  )
}
