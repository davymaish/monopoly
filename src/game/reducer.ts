import type { GameReducer } from './actions'
import { BOARD_SPACES } from './board'
import type { BoardSpace } from './board-space'
import { getHouseBuildingEligibility, getHotelBuildingEligibility } from './building-eligibility'
import { resolveLanding } from './landing'
import { appendGameLog } from './log'
import type { AuctionState, GameLogEvent, GameState, Player, PlayerId } from './model'
import { BOARD_SPACE_COUNT, calculateDestinationPosition, GO_SALARY } from './movement'
import { getPurchasableDeedById } from './purchasable'
import { RAILROADS } from './railroad-data'
import { calculateRailroadRent, calculateStreetRent, calculateUtilityPropertyRent } from './rent'
import { calculateTaxAmount } from './tax'
import { UTILITIES } from './utility-data'
import { getCardDefinition } from './cards'
import { STREET_PROPERTIES } from './street-data'

const TOTAL_HOUSE_SUPPLY = 32
const TOTAL_HOTEL_SUPPLY = 12

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

function calculatePropertyRepairCost(
  state: GameState,
  playerId: PlayerId,
  houseCost: number,
  hotelCost: number,
): number {
  return Object.entries(state.propertyBuildings).reduce((total, [propertyId, buildings]) => {
    if (state.ownership[propertyId] !== playerId) {
      return total
    }

    return total + buildings.houses * houseCost + buildings.hotels * hotelCost
  }, 0)
}

function resolveCardMovement(
  state: GameState,
  currentPlayer: Player,
  destination: BoardSpace,
  spacesMoved: number,
  goSalary: number,
  options: { railroadRentMultiplier?: 1 | 2; useNearestUtilityCardMultiplier?: boolean } = {},
): {
  players: Player[]
  landingResolution: GameState['landingResolution']
  events: GameLogEvent[]
} {
  const landingResolution = resolveLanding(
    destination,
    state.ownership,
    state.players.map(({ id }) => id),
    currentPlayer.id,
    state.mortgagedProperties,
  )
  const rentOwnerId =
    landingResolution.type === 'owned-property' && !landingResolution.ownedByCurrentPlayer
      ? landingResolution.ownerId
      : null
  const rentAmount =
    rentOwnerId && destination.kind === 'property'
      ? calculateStreetRent(destination.id, state.ownership, state.propertyBuildings)
      : rentOwnerId && destination.kind === 'railroad'
        ? calculateRailroadRent(
            destination.id,
            state.ownership,
            options.railroadRentMultiplier ?? 1,
          )
        : rentOwnerId && destination.kind === 'utility' && state.dice
          ? calculateUtilityPropertyRent(
              destination.id,
              state.ownership,
              state.dice[0] + state.dice[1],
              options.useNearestUtilityCardMultiplier,
            )
          : 0
  const players = state.players.map((player) =>
    player.id === currentPlayer.id
      ? {
          ...player,
          position: destination.position,
          cash: player.cash + goSalary - rentAmount,
        }
      : player.id === rentOwnerId
        ? { ...player, cash: player.cash + rentAmount }
        : player,
  )
  const events: GameLogEvent[] = [
    {
      type: 'movement',
      playerId: currentPlayer.id,
      from: currentPlayer.position,
      to: destination.position,
      spacesMoved,
    },
  ]

  if (goSalary > 0) {
    events.push({
      type: 'income',
      playerId: currentPlayer.id,
      amount: goSalary,
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
  } else if (landingResolution.type === 'mortgaged-property') {
    events.push({
      type: 'rent-skipped',
      payerId: currentPlayer.id,
      ownerId: landingResolution.ownerId,
      propertyId: landingResolution.spaceId,
      reason: 'mortgaged',
    })
  }

  return { players, landingResolution, events }
}

function applyJailTransition(
  state: GameState,
  players: Player[],
  currentPlayer: Player,
  source: 'board' | 'card' | 'third-double',
): {
  players: Player[]
  landingResolution: GameState['landingResolution']
  event: Extract<GameLogEvent, { type: 'sent-to-jail' }>
} | null {
  const jailSpace = BOARD_SPACES.find((space) => space.id === 'jail')
  if (!jailSpace) return null

  return {
    players: players.map((player) =>
      player.id === currentPlayer.id
        ? { ...player, position: jailSpace.position, isInJail: true, jailTurns: 0 }
        : player,
    ),
    landingResolution: resolveLanding(
      jailSpace,
      state.ownership,
      state.players.map(({ id }) => id),
      currentPlayer.id,
      state.mortgagedProperties,
    ),
    event: { type: 'sent-to-jail', playerId: currentPlayer.id, source },
  }
}

export const gameReducer: GameReducer = (state, action) => {
  const activePlayer = state.players[state.currentPlayerIndex]
  const isJailBailDebtCardUse =
    action.type === 'use-jail-free-card' &&
    state.debtResolution?.reason === 'jail-bail' &&
    state.debtResolution.debtorId === activePlayer?.id
  if (state.debtResolution !== null && !isJailBailDebtCardUse) {
    return state
  }

  switch (action.type) {
    case 'use-jail-free-card': {
      const currentPlayer = state.players[state.currentPlayerIndex]
      const isResolvingBailDebt = isJailBailDebtCardUse && state.phase === 'awaiting-player-action'
      const resumeJailMovement =
        isResolvingBailDebt && state.debtResolution?.resumeJailMovement === true
      const heldCardIndex = state.heldJailFreeCards.findIndex(
        (card) =>
          card.playerId === currentPlayer?.id &&
          getCardDefinition(card.deck, card.cardId)?.effect.type === 'get-out-of-jail-free',
      )
      const heldCard = state.heldJailFreeCards[heldCardIndex]

      if (
        !currentPlayer?.isInJail ||
        currentPlayer.getOutOfJailFreeCardCount <= 0 ||
        !heldCard ||
        (state.phase !== 'awaiting-roll' && !isResolvingBailDebt)
      ) {
        return state
      }

      const deckKey = heldCard.deck === 'chance' ? 'chance' : 'communityChest'
      const releasedState: GameState = {
        ...state,
        players: state.players.map((player) =>
          player.id === currentPlayer.id
            ? {
                ...player,
                isInJail: false,
                jailTurns: 0,
                getOutOfJailFreeCardCount: player.getOutOfJailFreeCardCount - 1,
              }
            : player,
        ),
        decks: {
          ...state.decks,
          [deckKey]: [...state.decks[deckKey], heldCard.cardId],
        },
        heldJailFreeCards: state.heldJailFreeCards.filter((_, index) => index !== heldCardIndex),
        debtResolution: null,
        dice: resumeJailMovement ? state.dice : null,
        doublesCount: 0,
        extraRollAvailable: false,
        jailAttemptInProgress: false,
        landingResolution: null,
        phase: resumeJailMovement ? 'resolving-turn' : 'awaiting-roll',
        log: appendGameLog(state.log, [
          {
            type: 'card-returned',
            playerId: currentPlayer.id,
            deck: heldCard.deck,
            cardId: heldCard.cardId,
          },
          { type: 'released-from-jail', playerId: currentPlayer.id, method: 'jail-free-card' },
        ]),
      }
      return resumeJailMovement
        ? gameReducer(releasedState, { type: 'move-player' })
        : releasedState
    }
    case 'pay-jail-bail': {
      const currentPlayer = state.players[state.currentPlayerIndex]
      if (state.phase !== 'awaiting-roll' || !currentPlayer?.isInJail) return state

      if (currentPlayer.cash < 50) {
        return {
          ...state,
          debtResolution: {
            debtorId: currentPlayer.id,
            creditorId: null,
            amount: 50,
            reason: 'jail-bail',
            resumeJailMovement: false,
          },
          landingResolution: null,
          phase: 'awaiting-player-action',
        }
      }

      return {
        ...state,
        players: state.players.map((player) =>
          player.id === currentPlayer.id
            ? { ...player, cash: player.cash - 50, isInJail: false, jailTurns: 0 }
            : player,
        ),
        dice: null,
        doublesCount: 0,
        extraRollAvailable: false,
        jailAttemptInProgress: false,
        landingResolution: null,
        phase: 'awaiting-roll',
        log: appendGameLog(state.log, [
          {
            type: 'payment',
            payerId: currentPlayer.id,
            payeeId: null,
            amount: 50,
            reason: 'jail-bail',
          },
          { type: 'released-from-jail', playerId: currentPlayer.id, method: 'bail' },
        ]),
      }
    }
    case 'roll-dice':
      if (
        state.phase !== 'awaiting-roll' ||
        !state.players[state.currentPlayerIndex] ||
        state.players[state.currentPlayerIndex]?.isInJail
      ) {
        return state
      }

      const isDoubles = action.dice[0] === action.dice[1]
      return {
        ...state,
        dice: action.dice,
        doublesCount: isDoubles ? state.doublesCount + 1 : 0,
        extraRollAvailable: isDoubles,
        jailAttemptInProgress: false,
        landingResolution: null,
        phase: 'resolving-turn',
        log: appendGameLog(state.log, [
          { type: 'roll', playerId: state.players[state.currentPlayerIndex].id, dice: action.dice },
        ]),
      }
    case 'roll-jail-attempt':
      if (state.phase !== 'awaiting-roll' || !state.players[state.currentPlayerIndex]?.isInJail) {
        return state
      }

      return {
        ...state,
        dice: action.dice,
        doublesCount: 0,
        extraRollAvailable: false,
        jailAttemptInProgress: true,
        landingResolution: null,
        phase: 'resolving-turn',
        log: appendGameLog(state.log, [
          {
            type: 'roll',
            playerId: state.players[state.currentPlayerIndex].id,
            dice: action.dice,
          },
        ]),
      }
    case 'move-player': {
      const currentPlayer = state.players[state.currentPlayerIndex]

      if (
        state.phase !== 'resolving-turn' ||
        state.dice === null ||
        !currentPlayer ||
        (currentPlayer.isInJail && !state.jailAttemptInProgress)
      ) {
        return state
      }

      if (currentPlayer.isInJail) {
        if (state.dice[0] !== state.dice[1]) {
          const jailTurns = Math.min(3, currentPlayer.jailTurns + 1)
          const failedAttemptPlayers = state.players.map((player) =>
            player.id === currentPlayer.id ? { ...player, jailTurns } : player,
          )

          if (jailTurns === 3 && currentPlayer.cash < 50) {
            return {
              ...state,
              players: failedAttemptPlayers,
              debtResolution: {
                debtorId: currentPlayer.id,
                creditorId: null,
                amount: 50,
                reason: 'jail-bail',
                resumeJailMovement: true,
              },
              extraRollAvailable: false,
              jailAttemptInProgress: false,
              landingResolution: null,
              phase: 'awaiting-player-action',
            }
          }

          if (jailTurns === 3) {
            const forcedReleaseState: GameState = {
              ...state,
              players: state.players.map((player) =>
                player.id === currentPlayer.id
                  ? { ...player, cash: player.cash - 50, isInJail: false, jailTurns: 0 }
                  : player,
              ),
              doublesCount: 0,
              extraRollAvailable: false,
              jailAttemptInProgress: false,
              phase: 'resolving-turn',
              log: appendGameLog(state.log, [
                {
                  type: 'payment',
                  payerId: currentPlayer.id,
                  payeeId: null,
                  amount: 50,
                  reason: 'jail-bail',
                },
                { type: 'released-from-jail', playerId: currentPlayer.id, method: 'bail' },
              ]),
            }
            return gameReducer(forcedReleaseState, { type: 'move-player' })
          }

          return {
            ...state,
            players: failedAttemptPlayers,
            extraRollAvailable: false,
            jailAttemptInProgress: false,
            landingResolution: null,
            phase: 'awaiting-player-action',
          }
        }

        const releasedState: GameState = {
          ...state,
          players: state.players.map((player) =>
            player.id === currentPlayer.id ? { ...player, isInJail: false, jailTurns: 0 } : player,
          ),
          doublesCount: 0,
          extraRollAvailable: false,
          jailAttemptInProgress: false,
          log: appendGameLog(state.log, [
            { type: 'released-from-jail', playerId: currentPlayer.id, method: 'doubles' },
          ]),
        }
        return gameReducer(releasedState, { type: 'move-player' })
      }

      if (state.doublesCount >= 3 && state.dice[0] === state.dice[1]) {
        const jailTransition = applyJailTransition(
          state,
          state.players,
          currentPlayer,
          'third-double',
        )
        if (!jailTransition) return state

        return {
          ...state,
          players: jailTransition.players,
          landingResolution: jailTransition.landingResolution,
          doublesCount: 0,
          extraRollAvailable: false,
          phase: 'awaiting-player-action',
          log: appendGameLog(state.log, [jailTransition.event]),
        }
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
      const sentToJail = landingResolution.type === 'go-to-jail'
      const rentOwnerId =
        landingResolution?.type === 'owned-property' && !landingResolution.ownedByCurrentPlayer
          ? landingResolution.ownerId
          : null
      const rentAmount =
        rentOwnerId && landingSpace?.kind === 'property'
          ? calculateStreetRent(landingSpace.id, state.ownership, state.propertyBuildings)
          : rentOwnerId && landingSpace?.kind === 'railroad'
            ? calculateRailroadRent(landingSpace.id, state.ownership)
            : rentOwnerId && landingSpace?.kind === 'utility'
              ? calculateUtilityPropertyRent(
                  landingSpace.id,
                  state.ownership,
                  state.dice[0] + state.dice[1],
                )
              : 0
      const passesGo =
        !sentToJail && currentPlayer.position + state.dice[0] + state.dice[1] >= BOARD_SPACE_COUNT
      const movedPlayers = state.players.map((player, index) => ({
        ...player,
        ...(index === state.currentPlayerIndex ? { position: destination } : {}),
        cash:
          player.cash +
          (index === state.currentPlayerIndex ? (passesGo ? GO_SALARY : 0) - rentAmount : 0) +
          (player.id === rentOwnerId ? rentAmount : 0),
      }))
      const jailTransition = sentToJail
        ? applyJailTransition(state, movedPlayers, currentPlayer, 'board')
        : null
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

      if (jailTransition) events.push(jailTransition.event)

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
        players: jailTransition?.players ?? movedPlayers,
        landingResolution: jailTransition?.landingResolution ?? landingResolution,
        ...(jailTransition ? { doublesCount: 0, extraRollAvailable: false } : {}),
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
      let landingResolution = state.landingResolution
      let doublesCount = state.doublesCount
      let extraRollAvailable = state.extraRollAvailable
      const events: GameLogEvent[] = []

      if (effect?.type === 'go-to-jail') {
        const jailTransition = applyJailTransition(state, players, currentPlayer, 'card')
        if (jailTransition) {
          players = jailTransition.players
          landingResolution = jailTransition.landingResolution
          doublesCount = 0
          extraRollAvailable = false
          events.push(jailTransition.event)
        }
      } else if (effect?.type === 'cash') {
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
      } else if (effect?.type === 'repairs') {
        const amount = calculatePropertyRepairCost(
          state,
          currentPlayer.id,
          effect.houseCost,
          effect.hotelCost,
        )

        if (amount > 0) {
          players = state.players.map((player) =>
            player.id === currentPlayer.id ? { ...player, cash: player.cash - amount } : player,
          )
          events.push({
            type: 'payment',
            payerId: currentPlayer.id,
            payeeId: null,
            amount,
            reason: 'card',
          })
        }
      } else if (
        effect?.type === 'advance-to' &&
        effect.destination === 'go' &&
        effect.goSalary === 'always'
      ) {
        const goSpace = BOARD_SPACES.find((space) => space.id === 'go')

        if (goSpace) {
          const spacesMoved =
            (goSpace.position - currentPlayer.position + BOARD_SPACE_COUNT) % BOARD_SPACE_COUNT
          players = state.players.map((player) =>
            player.id === currentPlayer.id
              ? { ...player, position: goSpace.position, cash: player.cash + GO_SALARY }
              : player,
          )
          landingResolution = resolveLanding(
            goSpace,
            state.ownership,
            state.players.map(({ id }) => id),
            currentPlayer.id,
            state.mortgagedProperties,
          )
          events.push(
            {
              type: 'movement',
              playerId: currentPlayer.id,
              from: currentPlayer.position,
              to: goSpace.position,
              spacesMoved,
            },
            { type: 'income', playerId: currentPlayer.id, amount: GO_SALARY, reason: 'go-salary' },
          )
        }
      } else if (effect?.type === 'advance-to' && effect.destination !== 'go') {
        const destination = BOARD_SPACES.find((space) => space.id === effect.destination)

        if (destination) {
          const spacesMoved =
            (destination.position - currentPlayer.position + BOARD_SPACE_COUNT) % BOARD_SPACE_COUNT
          const passesGo =
            effect.goSalary === 'if-passed' && destination.position < currentPlayer.position
          const movement = resolveCardMovement(
            state,
            currentPlayer,
            destination,
            spacesMoved,
            passesGo ? GO_SALARY : 0,
          )
          players = movement.players
          landingResolution = movement.landingResolution
          events.push(...movement.events)
        }
      } else if (effect?.type === 'advance-to-nearest-railroad') {
        const destination =
          RAILROADS.find((railroad) => railroad.position > currentPlayer.position) ?? RAILROADS[0]

        if (destination) {
          const spacesMoved =
            (destination.position - currentPlayer.position + BOARD_SPACE_COUNT) % BOARD_SPACE_COUNT
          const passesGo =
            effect.goSalary === 'if-passed' && destination.position < currentPlayer.position
          const movement = resolveCardMovement(
            state,
            currentPlayer,
            destination,
            spacesMoved,
            passesGo ? GO_SALARY : 0,
            { railroadRentMultiplier: effect.rentMultiplier },
          )
          players = movement.players
          landingResolution = movement.landingResolution
          events.push(...movement.events)
        }
      } else if (effect?.type === 'advance-to-nearest-utility') {
        const destination =
          UTILITIES.find((utility) => utility.position > currentPlayer.position) ?? UTILITIES[0]

        if (destination) {
          const spacesMoved =
            (destination.position - currentPlayer.position + BOARD_SPACE_COUNT) % BOARD_SPACE_COUNT
          const passesGo =
            effect.goSalary === 'if-passed' && destination.position < currentPlayer.position
          const movement = resolveCardMovement(
            state,
            currentPlayer,
            destination,
            spacesMoved,
            passesGo ? GO_SALARY : 0,
            { useNearestUtilityCardMultiplier: true },
          )
          players = movement.players
          landingResolution = movement.landingResolution
          events.push(...movement.events)
        }
      } else if (effect?.type === 'move-back') {
        const destinationPosition =
          (((currentPlayer.position - effect.spaces) % BOARD_SPACE_COUNT) + BOARD_SPACE_COUNT) %
          BOARD_SPACE_COUNT
        const destination = BOARD_SPACES.find((space) => space.position === destinationPosition)

        if (destination) {
          const movement = resolveCardMovement(state, currentPlayer, destination, -effect.spaces, 0)
          players = movement.players
          landingResolution = movement.landingResolution
          events.push(...movement.events)
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
        landingResolution,
        doublesCount,
        extraRollAvailable,
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

      if (state.extraRollAvailable) {
        return {
          ...state,
          landingResolution: null,
          dice: null,
          extraRollAvailable: false,
          phase: 'awaiting-roll',
        }
      }

      const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length
      const nextPlayer = state.players[nextPlayerIndex]

      if (!currentPlayer || !nextPlayer) {
        return state
      }

      return {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        doublesCount: 0,
        extraRollAvailable: false,
        landingResolution: null,
        dice: null,
        phase: 'awaiting-roll',
        log: appendGameLog(state.log, [
          { type: 'turn-change', fromPlayerId: currentPlayer.id, toPlayerId: nextPlayer.id },
        ]),
      }
    }
    case 'build-house': {
      const currentPlayer = state.players[state.currentPlayerIndex]
      const property = STREET_PROPERTIES.find((street) => street.id === action.propertyId)
      const buildings = state.propertyBuildings[action.propertyId]
      const housesInUse = Object.values(state.propertyBuildings).reduce(
        (total, propertyBuildings) => total + propertyBuildings.houses,
        0,
      )

      if (
        (state.phase !== 'awaiting-roll' && state.phase !== 'awaiting-player-action') ||
        state.pendingCard !== null ||
        !currentPlayer ||
        !property ||
        !buildings ||
        housesInUse >= TOTAL_HOUSE_SUPPLY ||
        buildings.houses >= 4 ||
        buildings.hotels > 0 ||
        currentPlayer.cash < property.houseCost ||
        !getHouseBuildingEligibility({
          playerId: currentPlayer.id,
          propertyId: action.propertyId,
          ownership: state.ownership,
          mortgagedProperties: state.mortgagedProperties,
          propertyBuildings: state.propertyBuildings,
        }).eligible
      ) {
        return state
      }

      return {
        ...state,
        players: state.players.map((player) =>
          player.id === currentPlayer.id
            ? { ...player, cash: player.cash - property.houseCost }
            : player,
        ),
        propertyBuildings: {
          ...state.propertyBuildings,
          [action.propertyId]: { ...buildings, houses: buildings.houses + 1 },
        },
        log: appendGameLog(state.log, [
          {
            type: 'payment',
            payerId: currentPlayer.id,
            payeeId: null,
            amount: property.houseCost,
            reason: 'house-purchase',
          },
        ]),
      }
    }
    case 'build-hotel': {
      const currentPlayer = state.players[state.currentPlayerIndex]
      const property = STREET_PROPERTIES.find((street) => street.id === action.propertyId)
      const buildings = state.propertyBuildings[action.propertyId]
      const hotelsInUse = Object.values(state.propertyBuildings).reduce(
        (total, propertyBuildings) => total + propertyBuildings.hotels,
        0,
      )

      if (
        (state.phase !== 'awaiting-roll' && state.phase !== 'awaiting-player-action') ||
        state.pendingCard !== null ||
        !currentPlayer ||
        !property ||
        !buildings ||
        hotelsInUse >= TOTAL_HOTEL_SUPPLY ||
        currentPlayer.cash < property.houseCost ||
        !getHotelBuildingEligibility({
          playerId: currentPlayer.id,
          propertyId: action.propertyId,
          ownership: state.ownership,
          mortgagedProperties: state.mortgagedProperties,
          propertyBuildings: state.propertyBuildings,
        }).eligible
      ) {
        return state
      }

      return {
        ...state,
        players: state.players.map((player) =>
          player.id === currentPlayer.id
            ? { ...player, cash: player.cash - property.houseCost }
            : player,
        ),
        propertyBuildings: {
          ...state.propertyBuildings,
          [action.propertyId]: { houses: 0, hotels: 1 },
        },
        log: appendGameLog(state.log, [
          {
            type: 'payment',
            payerId: currentPlayer.id,
            payeeId: null,
            amount: property.houseCost,
            reason: 'hotel-purchase',
          },
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
