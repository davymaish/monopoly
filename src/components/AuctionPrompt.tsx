import type { FormEvent, ReactElement } from 'react'
import type { GameState } from '../game/model'
import { getPurchasableDeedById } from '../game/purchasable'

interface AuctionPromptProps {
  gameState: GameState
  onBid: (amount: number) => void
  onPass: () => void
}

function formatCash(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

export default function AuctionPrompt({
  gameState,
  onBid,
  onPass,
}: AuctionPromptProps): ReactElement | null {
  const auction = gameState.auction
  if (!auction || gameState.phase !== 'auction') {
    return null
  }

  const deed = getPurchasableDeedById(auction.propertyId)
  const activeBidder = gameState.players.find((player) => player.id === auction.activeBidderId)
  const highBidder = auction.highBidderId
    ? gameState.players.find((player) => player.id === auction.highBidderId)
    : undefined
  const bankruptPlayer = auction.bankruptcy
    ? gameState.players.find((player) => player.id === auction.bankruptcy?.debtorId)
    : undefined

  if (!deed || !activeBidder) {
    return (
      <section className="purchase-prompt" aria-label="Property auction" role="alert">
        Auction details are unavailable.
      </section>
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const bid = Number(new FormData(event.currentTarget).get('bidAmount'))
    onBid(bid)
  }

  return (
    <section className="purchase-prompt" aria-labelledby="auction-prompt-heading">
      <h3 id="auction-prompt-heading">
        {auction.bankruptcy ? 'Bankruptcy auction' : 'Property auction'}
      </h3>
      <p>
        {bankruptPlayer ? `${bankruptPlayer.name} went bankrupt. ` : ''}
        <strong>{deed.name}</strong> is being auctioned.
      </p>
      <p>
        Current bid: {auction.highBid > 0 ? formatCash(auction.highBid) : 'No bids yet'}
        {highBidder ? ` by ${highBidder.name}` : ''}.
      </p>
      <p>
        {activeBidder.name} is bidding. Balance: {formatCash(activeBidder.cash)}.
      </p>
      <form className="purchase-prompt-actions" onSubmit={handleSubmit}>
        <label className="auction-bid-field">
          Bid amount
          <input
            aria-label="Bid amount"
            max={activeBidder.cash}
            min={auction.highBid + 1}
            name="bidAmount"
            required
            step="1"
            type="number"
          />
        </label>
        <button className="purchase-prompt-button" type="submit">
          Bid
        </button>
        <button
          className="purchase-prompt-button purchase-prompt-button--secondary"
          onClick={onPass}
          type="button"
        >
          Pass
        </button>
      </form>
    </section>
  )
}
