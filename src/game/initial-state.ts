import { BOARD_SPACES } from './board'
import { PLAYER_COLOR_IDS, type PlayerColor, type PlayerCount } from '../setup/config'
import { validateSetup } from '../setup/validation'

export const STARTING_CASH = 1500

export interface InitialPlayer {
  id: string
  name: string
  color: PlayerColor
  cash: number
  position: number
  ownedPropertyIds: string[]
  getOutOfJailFreeCardCount: number
}

export interface InitialGameState {
  players: InitialPlayer[]
  currentPlayerIndex: number
}

export interface InitialGameSetup {
  playerCount: PlayerCount
  playerNames: readonly string[]
  playerColors: readonly PlayerColor[]
}

function getGoPosition(): number {
  const goSpace = BOARD_SPACES.find((space) => space.id === 'go')

  if (!goSpace) {
    throw new Error('Board data must include a GO space.')
  }

  return goSpace.position
}

export function createInitialGameState(setup: InitialGameSetup): InitialGameState {
  const validation = validateSetup({
    playerCount: setup.playerCount,
    playerNames: setup.playerNames,
    playerColors: setup.playerColors,
    availableColorIds: PLAYER_COLOR_IDS,
  })

  if (!validation.isValid) {
    throw new Error(`Cannot create a game from invalid setup: ${validation.errors.join(' ')}`)
  }

  const goPosition = getGoPosition()
  const players = Array.from({ length: setup.playerCount }, (_, index) => {
    const name = setup.playerNames[index]
    const color = setup.playerColors[index]

    if (name === undefined || color === undefined) {
      throw new Error('Initial setup must provide a name and color for every player.')
    }

    return {
      id: `player-${index + 1}`,
      name,
      color,
      cash: STARTING_CASH,
      position: goPosition,
      ownedPropertyIds: [],
      getOutOfJailFreeCardCount: 0,
    }
  })

  return { players, currentPlayerIndex: 0 }
}
