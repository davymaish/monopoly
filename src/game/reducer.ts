import type { GameReducer } from './actions'

export const gameReducer: GameReducer = (state, action) => {
  switch (action.type) {
    case 'roll-dice':
    case 'end-turn':
    case 'buy-property':
    case 'decline-purchase':
      return state
    default:
      return state
  }
}
