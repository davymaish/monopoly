import type { GameReducer } from './actions'
import { BOARD_SPACES } from './board'
import { resolveLanding } from './landing'
import { appendGameLog } from './log'
import type { GameLogEvent } from './model'
import { BOARD_SPACE_COUNT, calculateDestinationPosition, GO_SALARY } from './movement'
import { getPurchasableDeedById } from './purchasable'

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
      )
      const passesGo = currentPlayer.position + state.dice[0] + state.dice[1] >= BOARD_SPACE_COUNT
      const players = state.players.map((player, index) =>
        index === state.currentPlayerIndex
          ? {
              ...player,
              position: destination,
              cash: player.cash + (passesGo ? GO_SALARY : 0),
            }
          : player,
      )
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

      return {
        ...state,
        players,
        landingResolution,
        phase: 'awaiting-player-action',
        log: appendGameLog(state.log, events),
      }
    }
    case 'end-turn': {
      if (
        state.phase !== 'awaiting-player-action' ||
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
      if (
        state.phase !== 'awaiting-player-action' ||
        state.landingResolution?.type !== 'unowned-property' ||
        state.landingResolution.spaceId !== action.propertyId ||
        state.ownership[action.propertyId] !== null
      ) {
        return state
      }

      return { ...state, landingResolution: null }
    }
    default:
      return state
  }
}
