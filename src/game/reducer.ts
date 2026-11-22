import type { GameReducer } from './actions'
import { BOARD_SPACES } from './board'
import { resolveLanding } from './landing'
import { appendGameLog } from './log'
import type { AuctionState, GameLogEvent, GameState, PlayerId } from './model'
import { BOARD_SPACE_COUNT, calculateDestinationPosition, GO_SALARY } from './movement'
import { getPurchasableDeedById } from './purchasable'
import { calculateRailroadRent, calculateStreetRent, calculateUtilityPropertyRent } from './rent'
import { calculateTaxAmount } from './tax'
import { getCardDefinition } from './cards'

function finishAuction(state: GameState, auction: AuctionState): GameState {
  const winner = auction.highBidderId
    ? state.players.find((player) => player.id === auction.highBidderId)
    : undefined
  const deed = getPurchasableDeedById(auction.propertyId)
  const canAward =
    winner !== undefined &&
    deed !== undefined &&
    state.ownership[auction.propertyId] === null &&
    winner.cash >= auction.highBid

  if (winner && deed && canAward) {
    const players = state.players.map((player) =>
      player.id === winner.id ? { ...player, cash: player.cash - auction.highBid } : player,
    )

    return {
      ...state,
      players,
      ownership: { ...state.ownership, [auction.propertyId]: winner.id },
      landingResolution: null,
      auction: null,
      phase: 'awaiting-player-action',
      log: appendGameLog(state.log, [
        {
          type: 'payment',
          payerId: winner.id,
          payeeId: null,
          amount: auction.highBid,
          reason: 'property-purchase',
        },
        {
          type: 'auction-ended',
          propertyId: auction.propertyId,
          winnerId: winner.id,
          amount: auction.highBid,
        },
      ]),
    }
  }

  return {
    ...state,
    landingResolution: null,
    auction: null,
    phase: 'awaiting-player-action',
    log: appendGameLog(state.log, [
      { type: 'auction-ended', propertyId: auction.propertyId, winnerId: null, amount: 0 },
    ]),
  }
}

function advanceAuction(
  state: GameState,
  auction: AuctionState,
  currentBidderId: PlayerId,
): GameState {
  const passed = new Set(auction.passedPlayerIds)
  const anotherBidderCanRespond = auction.highBidderId
    ? auction.biddingOrder.some(
        (playerId) => playerId !== auction.highBidderId && !passed.has(playerId),
      )
    : false

  if (
    (auction.highBidderId && !anotherBidderCanRespond) ||
    (!auction.highBidderId && passed.size === auction.biddingOrder.length)
  ) {
    return finishAuction(state, auction)
  }

  const currentIndex = auction.biddingOrder.indexOf(currentBidderId)
  for (let step = 1; step <= auction.biddingOrder.length; step += 1) {
    const nextBidderId = auction.biddingOrder[(currentIndex + step) % auction.biddingOrder.length]
    if (nextBidderId && !passed.has(nextBidderId)) {
      return { ...state, auction: { ...auction, activeBidderId: nextBidderId } }
    }
  }

  return finishAuction(state, auction)
}

export const gameReducer: GameReducer = (state, action) => {
  switch (action.type) {
    case 'roll-dice':
      if (state.phase !== 'awaiting-roll' || !state.players[state.currentPlayerIndex]) {
        return state
      }

      return {
        ...state,
        dice: action.dice,
        landingResolution: null,
        phase: 'resolving-turn',
        log: appendGameLog(state.log, [
          { type: 'roll', playerId: state.players[state.currentPlayerIndex].id, dice: action.dice },
        ]),
      }
    case 'move-player': {
      const currentPlayer = state.players[state.currentPlayerIndex]

      if (state.phase !== 'resolving-turn' || state.dice === null || !currentPlayer) {
        return state
      }

      const destination = calculateDestinationPosition(currentPlayer.position, state.dice)
      const landingSpace = BOARD_SPACES.find((space) => space.position === destination)
      const landingResolution = resolveLanding(
        landingSpace,
        state.ownership,
        state.players.map(({ id }) => id),
        currentPlayer.id,
        state.mortgagedProperties,
      )
      const rentOwnerId =
        landingResolution?.type === 'owned-property' && !landingResolution.ownedByCurrentPlayer
          ? landingResolution.ownerId
          : null
      const rentAmount =
        rentOwnerId && landingSpace?.kind === 'property'
          ? calculateStreetRent(landingSpace.id, state.ownership)
          : rentOwnerId && landingSpace?.kind === 'railroad'
            ? calculateRailroadRent(landingSpace.id, state.ownership)
            : rentOwnerId && landingSpace?.kind === 'utility'
              ? calculateUtilityPropertyRent(
                  landingSpace.id,
                  state.ownership,
                  state.dice[0] + state.dice[1],
                )
              : 0
      const passesGo = currentPlayer.position + state.dice[0] + state.dice[1] >= BOARD_SPACE_COUNT
      const players = state.players.map((player, index) => ({
        ...player,
        ...(index === state.currentPlayerIndex ? { position: destination } : {}),
        cash:
          player.cash +
          (index === state.currentPlayerIndex ? (passesGo ? GO_SALARY : 0) - rentAmount : 0) +
          (player.id === rentOwnerId ? rentAmount : 0),
      }))
      const events: GameLogEvent[] = [
        {
          type: 'movement',
          playerId: currentPlayer.id,
          from: currentPlayer.position,
          to: destination,
          spacesMoved: state.dice[0] + state.dice[1],
        },
      ]

      if (passesGo) {
        events.push({
          type: 'income',
          playerId: currentPlayer.id,
          amount: GO_SALARY,
          reason: 'go-salary',
        })
      }

      if (rentAmount > 0 && rentOwnerId) {
        events.push({
          type: 'payment',
          payerId: currentPlayer.id,
          payeeId: rentOwnerId,
          amount: rentAmount,
          reason: 'rent',
        })
      } else if (landingResolution?.type === 'mortgaged-property') {
        events.push({
          type: 'rent-skipped',
          payerId: currentPlayer.id,
          ownerId: landingResolution.ownerId,
          propertyId: landingResolution.spaceId,
          reason: 'mortgaged',
        })
      }

      return {
        ...state,
        players,
        landingResolution,
        phase: 'awaiting-player-action',
        log: appendGameLog(state.log, events),
      }
    }
    case 'pay-tax': {
      const resolution = state.landingResolution
      const currentPlayer = state.players[state.currentPlayerIndex]
      const amount =
        resolution?.type === 'tax' && currentPlayer
          ? calculateTaxAmount(state, currentPlayer.id, resolution.tax, action.choice)
          : null

      if (
        state.phase !== 'awaiting-player-action' ||
        resolution?.type !== 'tax' ||
        !currentPlayer ||
        amount === null ||
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        return state
      }

      return {
        ...state,
        players: state.players.map((player, index) =>
          index === state.currentPlayerIndex ? { ...player, cash: player.cash - amount } : player,
        ),
        landingResolution: null,
        log: appendGameLog(state.log, [
          { type: 'payment', payerId: currentPlayer.id, payeeId: null, amount, reason: 'tax' },
        ]),
      }
    }
    case 'draw-card': {
      const resolution = state.landingResolution
      const currentPlayer = state.players[state.currentPlayerIndex]
      const deckKey = action.deck === 'chance' ? 'chance' : 'communityChest'
      const cardId = state.decks[deckKey][0]
      const card = cardId ? getCardDefinition(action.deck, cardId) : undefined

      if (
        state.phase !== 'awaiting-player-action' ||
        resolution?.type !== 'card' ||
        resolution.deck !== action.deck ||
        state.pendingCard !== null ||
        !currentPlayer ||
        !cardId ||
        !card
      ) {
        return state
      }

      const drawnCard = { deck: action.deck, cardId, playerId: currentPlayer.id }
      const decks = { ...state.decks, [deckKey]: state.decks[deckKey].slice(1) }
      const events: GameLogEvent[] = [
        { type: 'card-drawn', playerId: currentPlayer.id, deck: action.deck, cardId },
      ]

      if (card.effect.type === 'get-out-of-jail-free') {
        return {
          ...state,
          decks,
          players: state.players.map((player) =>
            player.id === currentPlayer.id
              ? { ...player, getOutOfJailFreeCardCount: player.getOutOfJailFreeCardCount + 1 }
              : player,
          ),
          landingResolution: null,
          heldJailFreeCards: [...state.heldJailFreeCards, drawnCard],
          log: appendGameLog(state.log, events),
        }
      }

      return {
        ...state,
        decks,
        landingResolution: null,
        pendingCard: drawnCard,
        log: appendGameLog(state.log, events),
      }
    }
    case 'complete-card': {
      const pendingCard = state.pendingCard
      const currentPlayer = state.players[state.currentPlayerIndex]

      if (
        state.phase !== 'awaiting-player-action' ||
        !pendingCard ||
        !currentPlayer ||
        pendingCard.playerId !== currentPlayer.id
      ) {
        return state
      }

      const deckKey = pendingCard.deck === 'chance' ? 'chance' : 'communityChest'
      const card = getCardDefinition(pendingCard.deck, pendingCard.cardId)
      const effect = card?.effect
      const opponents = state.players.filter((player) => player.id !== currentPlayer.id)
      let players = state.players
      const events: GameLogEvent[] = []

      if (effect?.type === 'cash') {
        const cashChange = effect.direction === 'collect' ? effect.amount : -effect.amount
        players = state.players.map((player) =>
          player.id === currentPlayer.id ? { ...player, cash: player.cash + cashChange } : player,
        )

        if (effect.direction === 'collect') {
          events.push({
            type: 'income',
            playerId: currentPlayer.id,
            amount: effect.amount,
            reason: 'card',
          })
        } else {
          events.push({
            type: 'payment',
            payerId: currentPlayer.id,
            payeeId: null,
            amount: effect.amount,
            reason: 'card',
          })
        }
      } else if (effect?.type === 'collect-from-each-opponent') {
        players = state.players.map((player) =>
          player.id === currentPlayer.id
            ? { ...player, cash: player.cash + effect.amount * opponents.length }
            : { ...player, cash: player.cash - effect.amount },
        )
        for (const opponent of opponents) {
          events.push({
            type: 'payment',
            payerId: opponent.id,
            payeeId: currentPlayer.id,
            amount: effect.amount,
            reason: 'card',
          })
        }
      } else if (effect?.type === 'pay-each-opponent') {
        players = state.players.map((player) =>
          player.id === currentPlayer.id
            ? { ...player, cash: player.cash - effect.amount * opponents.length }
            : { ...player, cash: player.cash + effect.amount },
        )
        for (const opponent of opponents) {
          events.push({
            type: 'payment',
            payerId: currentPlayer.id,
            payeeId: opponent.id,
            amount: effect.amount,
            reason: 'card',
          })
        }
      }

      events.push({
        type: 'card-returned',
        playerId: currentPlayer.id,
        deck: pendingCard.deck,
        cardId: pendingCard.cardId,
      })

      return {
        ...state,
        players,
        decks: {
          ...state.decks,
          [deckKey]: [...state.decks[deckKey], pendingCard.cardId],
        },
        pendingCard: null,
        log: appendGameLog(state.log, events),
      }
    }
    case 'end-turn': {
      if (
        state.phase !== 'awaiting-player-action' ||
        state.landingResolution?.type === 'tax' ||
        state.landingResolution?.type === 'card' ||
        state.pendingCard !== null ||
        state.players.length === 0 ||
        !Number.isInteger(state.currentPlayerIndex) ||
        state.currentPlayerIndex < 0 ||
        state.currentPlayerIndex >= state.players.length
      ) {
        return state
      }

      const currentPlayer = state.players[state.currentPlayerIndex]
      const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length
      const nextPlayer = state.players[nextPlayerIndex]

      if (!currentPlayer || !nextPlayer) {
        return state
      }

      return {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        landingResolution: null,
        dice: null,
        phase: 'awaiting-roll',
        log: appendGameLog(state.log, [
          { type: 'turn-change', fromPlayerId: currentPlayer.id, toPlayerId: nextPlayer.id },
        ]),
      }
    }
    case 'buy-property': {
      const resolution = state.landingResolution
      const currentPlayer = state.players[state.currentPlayerIndex]
      const deed = getPurchasableDeedById(action.propertyId)

      if (
        state.phase !== 'awaiting-player-action' ||
        resolution?.type !== 'unowned-property' ||
        resolution.spaceId !== action.propertyId ||
        !currentPlayer ||
        !deed ||
        !Object.prototype.hasOwnProperty.call(state.ownership, action.propertyId) ||
        state.ownership[action.propertyId] !== null ||
        !(currentPlayer.cash >= deed.purchasePrice)
      ) {
        return state
      }

      const players = state.players.map((player, index) =>
        index === state.currentPlayerIndex
          ? { ...player, cash: player.cash - deed.purchasePrice }
          : player,
      )

      return {
        ...state,
        players,
        ownership: { ...state.ownership, [deed.id]: currentPlayer.id },
        landingResolution: null,
        log: appendGameLog(state.log, [
          {
            type: 'payment',
            payerId: currentPlayer.id,
            payeeId: null,
            amount: deed.purchasePrice,
            reason: 'property-purchase',
          },
        ]),
      }
    }
    case 'decline-purchase': {
      const currentPlayer = state.players[state.currentPlayerIndex]

      if (
        state.phase !== 'awaiting-player-action' ||
        state.landingResolution?.type !== 'unowned-property' ||
        state.landingResolution.spaceId !== action.propertyId ||
        state.ownership[action.propertyId] !== null ||
        !currentPlayer
      ) {
        return state
      }

      const biddingOrder = [
        ...state.players.slice(state.currentPlayerIndex + 1),
        ...state.players.slice(0, state.currentPlayerIndex + 1),
      ].map(({ id }) => id)
      const firstBidderId = biddingOrder[0]

      if (!firstBidderId) {
        return state
      }

      return {
        ...state,
        landingResolution: null,
        auction: {
          propertyId: action.propertyId,
          biddingOrder,
          activeBidderId: firstBidderId,
          highBid: 0,
          highBidderId: null,
          passedPlayerIds: [],
        },
        phase: 'auction',
      }
    }
    case 'auction-bid': {
      const auction = state.auction
      const bidder = auction
        ? state.players.find((player) => player.id === auction.activeBidderId)
        : undefined

      if (
        state.phase !== 'auction' ||
        !auction ||
        !bidder ||
        auction.passedPlayerIds.includes(bidder.id) ||
        !Number.isInteger(action.amount) ||
        action.amount <= auction.highBid ||
        action.amount > bidder.cash
      ) {
        return state
      }

      const updatedAuction = {
        ...auction,
        highBid: action.amount,
        highBidderId: bidder.id,
      }

      return advanceAuction(state, updatedAuction, bidder.id)
    }
    case 'auction-pass': {
      const auction = state.auction
      const bidder = auction
        ? state.players.find((player) => player.id === auction.activeBidderId)
        : undefined

      if (
        state.phase !== 'auction' ||
        !auction ||
        !bidder ||
        auction.passedPlayerIds.includes(bidder.id)
      ) {
        return state
      }

      const updatedAuction = {
        ...auction,
        passedPlayerIds: [...auction.passedPlayerIds, bidder.id],
      }

      return advanceAuction(state, updatedAuction, bidder.id)
    }
    default:
      return state
  }
}
