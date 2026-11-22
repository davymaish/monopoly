import { BOARD_SPACES } from './board'
import { PLAYER_COLOR_IDS, type PlayerColor, type PlayerCount } from '../setup/config'
import { validateSetup } from '../setup/validation'
import type { GameState, Player, PropertyOwnership } from './model'

export type { GameState as InitialGameState, Player as InitialPlayer } from './model'

export const STARTING_CASH = 1500

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

function createInitialOwnership(): PropertyOwnership {
  const ownership: PropertyOwnership = {}

  for (const space of BOARD_SPACES) {
    if (space.kind === 'property' || space.kind === 'railroad' || space.kind === 'utility') {
      ownership[space.id] = null
    }
  }

  return ownership
}

export function createInitialGameState(setup: InitialGameSetup): GameState {
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

    const player: Player = {
      id: `player-${index + 1}`,
      name,
      color,
      cash: STARTING_CASH,
      position: goPosition,
      ownedPropertyIds: [],
      getOutOfJailFreeCardCount: 0,
    }

    return player
  })

  return {
    players,
    currentPlayerIndex: 0,
    ownership: createInitialOwnership(),
    dice: null,
    decks: { chance: [], communityChest: [] },
    log: [],
    phase: 'awaiting-roll',
  }
}
