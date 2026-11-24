import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/initial-state'
import type { CardDeck } from '../game/cards'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function createJailedState(deck: CardDeck): GameState {
  const initialState = createInitialGameState(setup)
  const cardId = deck === 'chance' ? 'chance-jail-free' : 'community-chest-jail-free'
  return {
    ...initialState,
    players: initialState.players.map((player, index) =>
      index === 0
        ? { ...player, position: 10, isInJail: true, jailTurns: 2, getOutOfJailFreeCardCount: 1 }
        : player,
    ),
    heldJailFreeCards: [{ deck, cardId, playerId: 'player-1' }],
    decks: {
      chance: ['chance-bank-dividend'],
      communityChest: ['community-chest-bank-error'],
    },
  }
}

describe('Get Out of Jail Free card use', () => {
  it('consumes a Chance card, returns it to the bottom, and releases the player before rolling', () => {
    const state = createJailedState('chance')
    const released = gameReducer(state, { type: 'use-jail-free-card' })

    expect(released.players[0]).toMatchObject({
      position: 10,
      isInJail: false,
      jailTurns: 0,
      getOutOfJailFreeCardCount: 0,
    })
    expect(released.heldJailFreeCards).toEqual([])
    expect(released.decks.chance).toEqual(['chance-bank-dividend', 'chance-jail-free'])
    expect(released.decks.communityChest).toEqual(['community-chest-bank-error'])
    expect(released.phase).toBe('awaiting-roll')
    expect(released.log.map(({ event }) => event)).toEqual([
      {
        type: 'card-returned',
        playerId: 'player-1',
        deck: 'chance',
        cardId: 'chance-jail-free',
      },
      { type: 'released-from-jail', playerId: 'player-1', method: 'jail-free-card' },
    ])
    expect(gameReducer(released, { type: 'roll-dice', dice: [1, 2] }).phase).toBe('resolving-turn')
  })

  it('returns a Community Chest card to its own deck', () => {
    const state = createJailedState('community-chest')
    const released = gameReducer(state, { type: 'use-jail-free-card' })

    expect(released.decks.communityChest).toEqual([
      'community-chest-bank-error',
      'community-chest-jail-free',
    ])
    expect(released.decks.chance).toEqual(['chance-bank-dividend'])
  })

  it('lets a held card cancel an unpaid bail debt without paying bail', () => {
    const state: GameState = {
      ...createJailedState('chance'),
      players: createJailedState('chance').players.map((player, index) =>
        index === 0 ? { ...player, cash: 40 } : player,
      ),
      debtResolution: {
        debtorId: 'player-1',
        creditorId: null,
        amount: 50,
        reason: 'jail-bail',
        resumeJailMovement: false,
      },
      phase: 'awaiting-player-action',
    }
    const released = gameReducer(state, { type: 'use-jail-free-card' })

    expect(released.players[0]).toMatchObject({
      cash: 40,
      isInJail: false,
      getOutOfJailFreeCardCount: 0,
    })
    expect(released.debtResolution).toBeNull()
    expect(released.phase).toBe('awaiting-roll')
  })

  it('rejects use outside Jail or without a held card', () => {
    const state = createInitialGameState(setup)
    expect(gameReducer(state, { type: 'use-jail-free-card' })).toBe(state)

    const jailedWithoutCard = {
      ...state,
      players: state.players.map((player, index) =>
        index === 0 ? { ...player, position: 10, isInJail: true } : player,
      ),
    }
    expect(gameReducer(jailedWithoutCard, { type: 'use-jail-free-card' })).toBe(jailedWithoutCard)
  })
})
