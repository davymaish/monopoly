import type { ReactElement } from 'react'
import type { InitialGameState } from '../game/initial-state'
import { PLAYER_TOKEN_COLORS } from './PlayerColorSelector'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

interface PlayerPanelProps {
  gameState: InitialGameState
}

export default function PlayerPanel({ gameState }: PlayerPanelProps): ReactElement {
  return (
    <section className="player-panel" aria-labelledby="player-panel-heading">
      <h2 id="player-panel-heading">Players</h2>
      <ul className="player-panel-list">
        {gameState.players.map((player, index) => {
          const isBankrupt = gameState.bankruptPlayerIds.includes(player.id)
          const isCurrentPlayer = index === gameState.currentPlayerIndex && !isBankrupt
          const color = PLAYER_TOKEN_COLORS.find((option) => option.id === player.color)

          return (
            <li
              aria-current={isCurrentPlayer ? 'true' : undefined}
              className={`player-panel-card${isCurrentPlayer ? ' player-panel-card--active' : ''}`}
              key={player.id}
            >
              <span
                aria-hidden="true"
                className="player-panel-token"
                style={{ backgroundColor: color?.hex ?? 'transparent' }}
              />
              <div className="player-panel-details">
                <h3>{player.name}</h3>
                <p className="player-panel-color">{color?.name ?? 'Unknown'} token</p>
                <p className="player-panel-balance">
                  <span>Balance</span>
                  <strong>{currencyFormatter.format(player.cash)}</strong>
                </p>
                <span className="player-panel-turn">
                  {isBankrupt ? 'Bankrupt' : isCurrentPlayer ? 'Current turn' : 'Waiting'}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
