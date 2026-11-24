import { BOARD_SPACES } from './board'
import { PLAYER_COLOR_IDS, type PlayerColor, type PlayerCount } from '../setup/config'
import { validateSetup } from '../setup/validation'
import { createInitialPropertyOwnership } from './ownership'
import type { GameState, Player } from './model'
import { createShuffledDecks, type CardRandomSource } from './card-shuffle'
import { STREET_PROPERTIES } from './street-data'

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

export function createInitialGameState(
  setup: InitialGameSetup,
  randomSource: CardRandomSource = Math.random,
): GameState {
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
      isInJail: false,
      jailTurns: 0,
      getOutOfJailFreeCardCount: 0,
    }

    return player
  })

  return {
    players,
    currentPlayerIndex: 0,
    ownership: createInitialPropertyOwnership(),
    propertyBuildings: Object.fromEntries(
      STREET_PROPERTIES.map(({ id }) => [id, { houses: 0, hotels: 0 }]),
    ),
    mortgagedProperties: [],
    auction: null,
    landingResolution: null,
    dice: null,
    decks: createShuffledDecks(randomSource),
    pendingCard: null,
    heldJailFreeCards: [],
    doublesCount: 0,
    extraRollAvailable: false,
    log: [],
    phase: 'awaiting-roll',
  }
}
