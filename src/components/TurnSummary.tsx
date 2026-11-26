import type { ReactElement } from 'react'
import { BOARD_SPACES } from '../game/board'
import { canDeclareBankruptcyToBank } from '../game/bankruptcy'
import { getCardDefinition, type CardDeck } from '../game/cards'
import type { GameLogEvent, GameState, Player } from '../game/model'
import RollDiceControl from './RollDiceControl'

interface TurnSummaryProps {
  gameState: GameState
  onRollDice: () => void
  onRollJailAttempt?: () => void
  onPayJailBail?: () => void
  onPayDebt?: () => void
  onDeclareBankruptcy?: () => void
  onUseJailFreeCard?: () => void
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
    case 'movement': {
      const direction = event.spacesMoved < 0 ? 'back ' : ''
      return `${getPlayerName(players, event.playerId)} moved ${direction}${Math.abs(event.spacesMoved)} spaces to ${getSpaceName(event.to)}.`
    }
    case 'sent-to-jail':
      if (event.source === 'board') {
        return `${getPlayerName(players, event.playerId)} was sent directly to Jail by the Go to Jail space.`
      }
      if (event.source === 'third-double') {
        return `${getPlayerName(players, event.playerId)} was sent directly to Jail after rolling doubles three times.`
      }
      return `${getPlayerName(players, event.playerId)} was sent directly to Jail by a card.`
    case 'released-from-jail':
      if (event.method === 'bail') {
        return `${getPlayerName(players, event.playerId)} paid $50 bail and was released from Jail.`
      }
      return event.method === 'jail-free-card'
        ? `${getPlayerName(players, event.playerId)} used a Get Out of Jail Free card.`
        : `${getPlayerName(players, event.playerId)} rolled doubles and was released from Jail.`
    case 'income':
      if (event.reason === 'go-salary') {
        return `${getPlayerName(players, event.playerId)} received ${formatCash(event.amount)} in GO salary.`
      }
      if (event.reason === 'building-sale') {
        return `${getPlayerName(players, event.playerId)} received ${formatCash(event.amount)} for sold buildings.`
      }
      if (event.reason === 'mortgage') {
        return `${getPlayerName(players, event.playerId)} received ${formatCash(event.amount)} from a mortgage.`
      }
      return `${getPlayerName(players, event.playerId)} collected ${formatCash(event.amount)} from a card.`
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
    case 'bankruptcy':
      return `${getPlayerName(players, event.playerId)} went bankrupt to the bank.`
  }
}

export default function TurnSummary({
  gameState,
  onRollDice,
  onRollJailAttempt = () => {},
  onPayJailBail = () => {},
  onPayDebt = () => {},
  onDeclareBankruptcy = () => {},
  onUseJailFreeCard = () => {},
  onMovePlayer,
  onEndTurn,
  onDrawCard,
  onCompleteCard,
}: TurnSummaryProps): ReactElement {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const recentEntries = gameState.log.slice(-5)
  const currentPlayerInJail = currentPlayer?.isInJail === true
  const hasPendingPlayerAction =
    gameState.landingResolution?.type === 'unowned-property' ||
    gameState.landingResolution?.type === 'tax' ||
    gameState.landingResolution?.type === 'card' ||
    gameState.pendingCard !== null ||
    gameState.debtResolution !== null
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
  const debt = gameState.debtResolution
  const debtor = debt ? gameState.players.find((player) => player.id === debt.debtorId) : undefined
  const creditor = debt?.creditorId
    ? (gameState.players.find((player) => player.id === debt.creditorId)?.name ?? 'another player')
    : 'the bank'
  const canDeclareBankruptcy =
    debt?.creditorId === null &&
    debtor !== undefined &&
    canDeclareBankruptcyToBank(gameState, debtor.id)
  const canUseJailFreeCardForDebt =
    debt?.reason === 'jail-bail' && (debtor?.getOutOfJailFreeCardCount ?? 0) > 0

  return (
    <section className="turn-summary" aria-labelledby="turn-summary-heading">
      <h3 id="turn-summary-heading">Turn summary</h3>
      <p className="turn-summary-current">
        Current player: <strong>{currentPlayer?.name ?? 'Unknown player'}</strong>
      </p>
      {currentPlayerInJail ? (
        <section className="turn-summary-status" aria-label="Jail turn choices">
          <h4>In Jail</h4>
          <p aria-live="polite">
            Failed doubles attempts: {Math.min(currentPlayer.jailTurns, 3)} of 3.
          </p>
          {gameState.debtResolution ? (
            <>
              {currentPlayer.getOutOfJailFreeCardCount > 0 && (
                <button className="turn-action-button" onClick={onUseJailFreeCard} type="button">
                  Use Get Out of Jail Free card
                </button>
              )}
            </>
          ) : (
            <>
              {gameState.phase === 'awaiting-roll' && (
                <>
                  <p>
                    {currentPlayer.jailTurns >= 2
                      ? 'This is your third and final doubles attempt. If you fail, pay $50 bail and move by this roll.'
                      : 'Choose how to leave Jail: attempt to roll doubles, pay $50 bail, or use a Get Out of Jail Free card.'}
                  </p>
                  <button className="turn-action-button" onClick={onRollJailAttempt} type="button">
                    Attempt to roll doubles
                  </button>
                  <button className="turn-action-button" onClick={onPayJailBail} type="button">
                    Pay $50 bail
                  </button>
                  {currentPlayer.getOutOfJailFreeCardCount > 0 && (
                    <button
                      className="turn-action-button"
                      onClick={onUseJailFreeCard}
                      type="button"
                    >
                      Use Get Out of Jail Free card
                    </button>
                  )}
                </>
              )}
              {gameState.phase === 'resolving-turn' && (
                <button className="turn-action-button" onClick={onMovePlayer} type="button">
                  Resolve Jail roll
                </button>
              )}
              {gameState.phase === 'awaiting-player-action' &&
                !gameState.debtResolution &&
                gameState.dice !== null &&
                gameState.dice[0] !== gameState.dice[1] && (
                  <p role="status">No doubles; remain in Jail and end your turn.</p>
                )}
            </>
          )}
        </section>
      ) : debt ? null : (
        <RollDiceControl onRollDice={onRollDice} phase={gameState.phase} />
      )}
      {debt && debtor && (
        <section className="turn-summary-status" aria-label="Debt resolution">
          <h4>Debt resolution</h4>
          <p role="status">
            {debtor.name} owes {formatCash(debt.amount)} to {creditor} for{' '}
            {debt.reason.replace(/-/g, ' ')}. Available cash: {formatCash(debtor.cash)}.
            {debtor.cash < debt.amount
              ? canUseJailFreeCardForDebt
                ? ' Use a Get Out of Jail Free card or sell buildings and mortgage eligible properties before paying.'
                : canDeclareBankruptcy
                  ? ' No legal building sales or mortgages remain.'
                  : ' Sell buildings or mortgage eligible properties before paying.'
              : ' Pay this debt to continue.'}
          </p>
          {canDeclareBankruptcy && (
            <button className="turn-action-button" onClick={onDeclareBankruptcy} type="button">
              Declare bankruptcy to the bank
            </button>
          )}
          {debtor.cash >= debt.amount && (
            <button className="turn-action-button" onClick={onPayDebt} type="button">
              Pay {formatCash(debt.amount)} debt
            </button>
          )}
        </section>
      )}
      {gameState.phase === 'awaiting-player-action' && gameState.extraRollAvailable && (
        <p className="turn-summary-status" role="status">
          Doubles! Resolve this space, then roll again.
        </p>
      )}
      {gameState.phase === 'resolving-turn' && !currentPlayerInJail && (
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
          <p className="turn-summary-status" role="status" aria-live="polite">
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
            {gameState.extraRollAvailable ? 'Roll again' : 'End turn'}
          </button>
        </div>
      )}
      {gameState.phase === 'awaiting-player-action' &&
        hasPendingPlayerAction &&
        !gameState.debtResolution &&
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
