import type { ReactElement } from 'react'
import { BOARD_SPACES } from '../game/board'
import { getCardDefinition, type CardDeck } from '../game/cards'
import type { GameLogEvent, GameState, Player } from '../game/model'
import RollDiceControl from './RollDiceControl'

interface TurnSummaryProps {
  gameState: GameState
  onRollDice: () => void
  onMovePlayer: () => void
  onEndTurn: () => void
  onDrawCard: (deck: CardDeck) => void
  onCompleteCard: () => void
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
      return event.reason === 'go-salary'
        ? `${getPlayerName(players, event.playerId)} received ${formatCash(event.amount)} in GO salary.`
        : `${getPlayerName(players, event.playerId)} collected ${formatCash(event.amount)} from a card.`
    case 'payment': {
      const payee = event.payeeId ? getPlayerName(players, event.payeeId) : 'the bank'
      const reason = event.reason.replace(/-/g, ' ')
      return `${getPlayerName(players, event.payerId)} paid ${formatCash(event.amount)} to ${payee} for ${reason}.`
    }
    case 'rent-skipped': {
      const propertyName =
        BOARD_SPACES.find((space) => space.id === event.propertyId)?.name ?? event.propertyId
      return `${getPlayerName(players, event.payerId)} landed on ${propertyName}; no rent was paid to ${getPlayerName(players, event.ownerId)} because it is mortgaged.`
    }
    case 'auction-ended': {
      const propertyName =
        BOARD_SPACES.find((space) => space.id === event.propertyId)?.name ?? event.propertyId
      return event.winnerId
        ? `${getPlayerName(players, event.winnerId)} won ${propertyName} at auction for ${formatCash(event.amount)}.`
        : `The auction for ${propertyName} ended with no bids.`
    }
    case 'card-drawn': {
      const deckName = event.deck === 'chance' ? 'Chance' : 'Community Chest'
      const cardText = getCardDefinition(event.deck, event.cardId)?.text ?? event.cardId
      return `${getPlayerName(players, event.playerId)} drew from ${deckName}: ${cardText}`
    }
    case 'card-returned': {
      const deckName = event.deck === 'chance' ? 'Chance' : 'Community Chest'
      return `${getPlayerName(players, event.playerId)} returned the card to the bottom of the ${deckName} deck.`
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
  onDrawCard,
  onCompleteCard,
}: TurnSummaryProps): ReactElement {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const recentEntries = gameState.log.slice(-5)
  const hasPendingPlayerAction =
    gameState.landingResolution?.type === 'unowned-property' ||
    gameState.landingResolution?.type === 'tax' ||
    gameState.landingResolution?.type === 'card' ||
    gameState.pendingCard !== null
  const landingCardDeck =
    gameState.landingResolution?.type === 'card' ? gameState.landingResolution.deck : null
  const landingCardDeckName =
    landingCardDeck === 'chance'
      ? 'Chance'
      : landingCardDeck === 'community-chest'
        ? 'Community Chest'
        : null
  const pendingCardDefinition = gameState.pendingCard
    ? getCardDefinition(gameState.pendingCard.deck, gameState.pendingCard.cardId)
    : undefined

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
      {gameState.phase === 'awaiting-player-action' && landingCardDeck && landingCardDeckName && (
        <>
          <p className="turn-summary-status">
            Draw a {landingCardDeckName} card before ending your turn.
          </p>
          <div className="turn-summary-actions">
            <button
              className="turn-action-button"
              onClick={() => onDrawCard(landingCardDeck)}
              type="button"
            >
              Draw {landingCardDeckName} card
            </button>
          </div>
        </>
      )}
      {gameState.phase === 'awaiting-player-action' && gameState.pendingCard && (
        <>
          <p className="turn-summary-status">
            {pendingCardDefinition?.text ?? gameState.pendingCard.cardId}
          </p>
          <div className="turn-summary-actions">
            <button className="turn-action-button" onClick={onCompleteCard} type="button">
              Continue
            </button>
          </div>
        </>
      )}
      {gameState.phase === 'awaiting-player-action' && !hasPendingPlayerAction && (
        <div className="turn-summary-actions">
          <button className="turn-action-button" onClick={onEndTurn} type="button">
            End turn
          </button>
        </div>
      )}
      {gameState.phase === 'awaiting-player-action' &&
        hasPendingPlayerAction &&
        !gameState.pendingCard &&
        !landingCardDeck && (
          <p className="turn-summary-status">
            {gameState.landingResolution?.type === 'tax'
              ? 'Pay the tax before ending your turn.'
              : 'Choose to buy or decline before ending your turn.'}
          </p>
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
