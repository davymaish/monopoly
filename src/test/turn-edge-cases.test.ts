import { describe, expect, it } from 'vitest'
import type { CardDeck } from '../game/cards'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function moveCardToTop(state: GameState, deck: CardDeck, cardId: string): GameState {
  const deckKey = deck === 'chance' ? 'chance' : 'communityChest'
  return {
    ...state,
    decks: {
      ...state.decks,
      [deckKey]: [cardId, ...state.decks[deckKey].filter((id) => id !== cardId)],
    },
  }
}

describe('cross-feature turn-flow edge cases', () => {
  it('resolves a double-to-Chance back-three chain into Jail without leaking the bonus roll', () => {
    const initialState = createInitialGameState(setup, () => 0)
    const preparedState: GameState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0 ? { ...player, position: 32 } : { ...player, position: 17 },
      ),
    }
    const withChance = moveCardToTop(preparedState, 'chance', 'chance-back-three')
    const withCards = moveCardToTop(withChance, 'community-chest', 'community-chest-go-to-jail')

    const rolledDouble = gameReducer(withCards, { type: 'roll-dice', dice: [2, 2] })
    const landedOnChance = gameReducer(rolledDouble, { type: 'move-player' })
    expect(landedOnChance).toMatchObject({
      doublesCount: 1,
      extraRollAvailable: true,
      landingResolution: { type: 'card', spaceId: 'chance-3', deck: 'chance' },
    })
    const drewChance = gameReducer(landedOnChance, { type: 'draw-card', deck: 'chance' })
    const movedBackToChest = gameReducer(drewChance, { type: 'complete-card' })

    expect(movedBackToChest.players[0]).toMatchObject({ position: 33, isInJail: false })
    expect(movedBackToChest).toMatchObject({
      doublesCount: 1,
      extraRollAvailable: true,
      landingResolution: { type: 'card', spaceId: 'community-chest-3', deck: 'community-chest' },
    })
    const drewChest = gameReducer(movedBackToChest, {
      type: 'draw-card',
      deck: 'community-chest',
    })
    const sentToJail = gameReducer(drewChest, { type: 'complete-card' })

    expect(sentToJail.players[0]).toMatchObject({
      position: 10,
      isInJail: true,
      jailTurns: 0,
    })
    expect(sentToJail).toMatchObject({
      currentPlayerIndex: 0,
      doublesCount: 0,
      extraRollAvailable: false,
      phase: 'awaiting-player-action',
      landingResolution: { type: 'jail-visit' },
    })
    expect(sentToJail.log.map(({ event }) => event)).toContainEqual({
      type: 'movement',
      playerId: 'player-1',
      from: 36,
      to: 33,
      spacesMoved: -3,
    })
    expect(sentToJail.log.map(({ event }) => event)).toContainEqual({
      type: 'sent-to-jail',
      playerId: 'player-1',
      source: 'card',
    })

    const secondPlayerTurn = gameReducer(sentToJail, { type: 'end-turn' })
    expect(secondPlayerTurn).toMatchObject({
      currentPlayerIndex: 1,
      doublesCount: 0,
      extraRollAvailable: false,
      dice: null,
      phase: 'awaiting-roll',
    })
    const secondPlayerRoll = gameReducer(secondPlayerTurn, { type: 'roll-dice', dice: [1, 2] })
    const secondPlayerMoved = gameReducer(secondPlayerRoll, { type: 'move-player' })
    expect(secondPlayerMoved.players[1]).toMatchObject({ position: 20, isInJail: false })
    expect(secondPlayerMoved).toMatchObject({
      currentPlayerIndex: 1,
      doublesCount: 0,
      extraRollAvailable: false,
      phase: 'awaiting-player-action',
    })
    const jailedPlayerTurn = gameReducer(secondPlayerMoved, { type: 'end-turn' })
    expect(jailedPlayerTurn).toMatchObject({
      currentPlayerIndex: 0,
      doublesCount: 0,
      extraRollAvailable: false,
      dice: null,
      phase: 'awaiting-roll',
    })
    expect(jailedPlayerTurn.players[0]?.isInJail).toBe(true)
  })

  it('releases on Jail doubles without granting another roll and preserves the next turn sequence', () => {
    const initialState = createInitialGameState(setup, () => 0)
    const jailedState: GameState = {
      ...initialState,
      players: initialState.players.map((player, index) =>
        index === 0
          ? { ...player, position: 10, isInJail: true, jailTurns: 2 }
          : { ...player, position: 17 },
      ),
    }
    const attempt = gameReducer(jailedState, { type: 'roll-jail-attempt', dice: [5, 5] })
    const released = gameReducer(attempt, { type: 'move-player' })

    expect(released.players[0]).toMatchObject({
      position: 20,
      isInJail: false,
      jailTurns: 0,
    })
    expect(released).toMatchObject({
      currentPlayerIndex: 0,
      doublesCount: 0,
      extraRollAvailable: false,
      phase: 'awaiting-player-action',
    })
    expect(released.log.map(({ event }) => event)).toEqual([
      { type: 'roll', playerId: 'player-1', dice: [5, 5] },
      { type: 'released-from-jail', playerId: 'player-1', method: 'doubles' },
      { type: 'movement', playerId: 'player-1', from: 10, to: 20, spacesMoved: 10 },
    ])

    const secondPlayerTurn = gameReducer(released, { type: 'end-turn' })
    const secondPlayerRoll = gameReducer(secondPlayerTurn, { type: 'roll-dice', dice: [1, 2] })
    const secondPlayerMoved = gameReducer(secondPlayerRoll, { type: 'move-player' })
    const nextFirstPlayerTurn = gameReducer(secondPlayerMoved, { type: 'end-turn' })

    expect(nextFirstPlayerTurn).toMatchObject({
      currentPlayerIndex: 0,
      doublesCount: 0,
      extraRollAvailable: false,
      dice: null,
      phase: 'awaiting-roll',
    })
    const nextFirstPlayerRoll = gameReducer(nextFirstPlayerTurn, {
      type: 'roll-dice',
      dice: [1, 2],
    })
    expect(nextFirstPlayerRoll).toMatchObject({
      currentPlayerIndex: 0,
      doublesCount: 0,
      extraRollAvailable: false,
      phase: 'resolving-turn',
    })
    expect(nextFirstPlayerRoll.players[0]?.isInJail).toBe(false)
  })
})
