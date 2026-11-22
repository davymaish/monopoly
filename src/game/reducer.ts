import type { GameReducer } from './actions'
import { calculateDestinationPosition } from './movement'

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
      const players = state.players.map((player, index) =>
        index === state.currentPlayerIndex ? { ...player, position: destination } : player,
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
