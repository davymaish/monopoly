import type { GameReducer } from './actions'
import { BOARD_SPACE_COUNT, calculateDestinationPosition, GO_SALARY } from './movement'

export const gameReducer: GameReducer = (state, action) => {
  switch (action.type) {
    case 'roll-dice':
      if (state.phase !== 'awaiting-roll') {
        return state
      }

      return { ...state, dice: action.dice, phase: 'resolving-turn' }
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

      return { ...state, players, phase: 'awaiting-player-action' }
    }
    case 'end-turn':
    case 'buy-property':
    case 'decline-purchase':
      return state
    default:
      return state
  }
}
