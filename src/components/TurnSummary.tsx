import type { ReactElement } from 'react'
import { BOARD_SPACES } from '../game/board'
import type { GameLogEvent, GameState, Player } from '../game/model'
import RollDiceControl from './RollDiceControl'

interface TurnSummaryProps {
  gameState: GameState
  onRollDice: () => void
  onMovePlayer: () => void
  onEndTurn: () => void
}

function getPlayerName(players: Player[], playerId: string): string {
  return players.find((player) => player.id === playerId)?.name ?? 'Unknown player'
}

function getSpaceName(position: number): string {
  return BOARD_SPACES.find((space) => space.position === position)?.name ?? `space ${position + 1}`
}

function formatCash(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

function describeEvent(event: GameLogEvent, players: Player[]): string {
  switch (event.type) {
    case 'roll':
      return `${getPlayerName(players, event.playerId)} rolled ${event.dice[0]} and ${event.dice[1]}.`
    case 'movement':
      return `${getPlayerName(players, event.playerId)} moved ${event.spacesMoved} spaces to ${getSpaceName(event.to)}.`
    case 'income':
      return `${getPlayerName(players, event.playerId)} received ${formatCash(event.amount)} for passing GO.`
    case 'payment': {
      const payee = event.payeeId ? getPlayerName(players, event.payeeId) : 'the bank'
      const reason = event.reason.replace(/-/g, ' ')
      return `${getPlayerName(players, event.payerId)} paid ${formatCash(event.amount)} to ${payee} for ${reason}.`
    }
    case 'turn-change':
      return `${getPlayerName(players, event.fromPlayerId)} ended their turn. ${getPlayerName(players, event.toPlayerId)} is up next.`
  }
}

export default function TurnSummary({
  gameState,
  onRollDice,
  onMovePlayer,
  onEndTurn,
}: TurnSummaryProps): ReactElement {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const recentEntries = gameState.log.slice(-5)

  return (
    <section className="turn-summary" aria-labelledby="turn-summary-heading">
      <h3 id="turn-summary-heading">Turn summary</h3>
      <p className="turn-summary-current">
        Current player: <strong>{currentPlayer?.name ?? 'Unknown player'}</strong>
      </p>
      <RollDiceControl onRollDice={onRollDice} phase={gameState.phase} />
      {gameState.phase === 'resolving-turn' && (
        <div className="turn-summary-actions">
          <button className="turn-action-button" onClick={onMovePlayer} type="button">
            Complete movement
          </button>
        </div>
      )}
      {gameState.phase === 'awaiting-player-action' && (
        <div className="turn-summary-actions">
          <button className="turn-action-button" onClick={onEndTurn} type="button">
            End turn
          </button>
        </div>
      )}
      {gameState.phase === 'game-over' && (
        <p className="turn-summary-status">The game has ended.</p>
      )}
      <section className="recent-activity" aria-labelledby="recent-activity-heading">
        <h4 id="recent-activity-heading">Recent activity</h4>
        {recentEntries.length > 0 ? (
          <ol className="recent-activity-list" aria-label="Recent activity" aria-live="polite">
            {recentEntries.map((entry) => (
              <li key={entry.id}>{describeEvent(entry.event, gameState.players)}</li>
            ))}
          </ol>
        ) : (
          <p className="recent-activity-empty">No recent activity.</p>
        )}
      </section>
    </section>
  )
}
