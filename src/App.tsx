import type { ReactElement } from 'react'
import BoardPerimeter from './components/BoardPerimeter'

export default function App(): ReactElement {
  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-eyebrow">A classic game of chance and strategy</p>
        <h1 className="app-title">Monopoly</h1>
        <p className="app-subtitle">Local pass-and-play for 2–4 players</p>
      </header>
      <main className="app-main">
        <BoardPerimeter />
      </main>
    </div>
  )
}
