import type { GameReducer } from './actions'

export const gameReducer: GameReducer = (state, action) => {
  switch (action.type) {
    case 'roll-dice':
      if (state.phase !== 'awaiting-roll') {
        return state
      }

      return { ...state, dice: action.dice, phase: 'resolving-turn' }
    case 'end-turn':
    case 'buy-property':
    case 'decline-purchase':
      return state
    default:
      return state
  }
}
