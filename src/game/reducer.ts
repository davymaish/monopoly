import type { GameReducer } from './actions'
import { appendGameLog } from './log'
import type { GameLogEvent } from './model'
import { BOARD_SPACE_COUNT, calculateDestinationPosition, GO_SALARY } from './movement'

export const gameReducer: GameReducer = (state, action) => {
  switch (action.type) {
    case 'roll-dice':
      if (state.phase !== 'awaiting-roll' || !state.players[state.currentPlayerIndex]) {
        return state
      }

      return {
        ...state,
        dice: action.dice,
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
        dice: null,
        phase: 'awaiting-roll',
        log: appendGameLog(state.log, [
          { type: 'turn-change', fromPlayerId: currentPlayer.id, toPlayerId: nextPlayer.id },
        ]),
      }
    }
    case 'buy-property':
    case 'decline-purchase':
      return state
    default:
      return state
  }
}
