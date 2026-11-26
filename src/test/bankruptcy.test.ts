import { describe, expect, it } from 'vitest'
import { canDeclareBankruptcyToBank } from '../game/bankruptcy'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'
import { gameReducer } from '../game/reducer'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function createBankDebtState(withMortgageRemedy = false): GameState {
  const initialState = createInitialGameState(setup)
  return {
    ...initialState,
    players: initialState.players.map((player, index) =>
      index === 0 ? { ...player, cash: 10, getOutOfJailFreeCardCount: 1 } : player,
    ),
    ownership: {
      ...initialState.ownership,
      'mediterranean-avenue': 'player-1',
      'reading-railroad': 'player-1',
    },
    propertyBuildings: {
      ...initialState.propertyBuildings,
      'mediterranean-avenue': { houses: 1, hotels: 0 },
    },
    mortgagedProperties: withMortgageRemedy ? [] : ['reading-railroad'],
    decks: {
      ...initialState.decks,
      chance: initialState.decks.chance.filter((cardId) => cardId !== 'chance-jail-free'),
    },
    heldJailFreeCards: [{ deck: 'chance', cardId: 'chance-jail-free', playerId: 'player-1' }],
    debtResolution: {
      debtorId: 'player-1',
      creditorId: null,
      amount: 100,
      reason: 'tax',
      resumeJailMovement: false,
    },
    phase: 'awaiting-player-action',
  }
}

describe('bankruptcy to the bank', () => {
  it('allows bankruptcy only after legal debt remedies are exhausted', () => {
    const exhausted = createBankDebtState()
    const mortgageAvailable = createBankDebtState(true)
    const playerDebt: GameState = {
      ...exhausted,
      debtResolution: { ...exhausted.debtResolution!, creditorId: 'player-2' },
    }

    expect(canDeclareBankruptcyToBank(exhausted, 'player-1')).toBe(true)
    expect(canDeclareBankruptcyToBank(mortgageAvailable, 'player-1')).toBe(false)
    expect(canDeclareBankruptcyToBank(playerDebt, 'player-1')).toBe(false)
    expect(gameReducer(mortgageAvailable, { type: 'declare-bankruptcy' })).toBe(mortgageAvailable)
    expect(gameReducer(playerDebt, { type: 'declare-bankruptcy' })).toBe(playerDebt)
  })

  it('liquidates buildings first, resets deeds and mortgages, and queues bank auctions in board order', () => {
    const state = createBankDebtState()
    const bankrupt = gameReducer(state, { type: 'declare-bankruptcy' })

    expect(bankrupt.players[0]).toMatchObject({ cash: 0, getOutOfJailFreeCardCount: 0 })
    expect(bankrupt.bankruptPlayerIds).toEqual(['player-1'])
    expect(bankrupt.ownership['mediterranean-avenue']).toBeNull()
    expect(bankrupt.ownership['reading-railroad']).toBeNull()
    expect(bankrupt.propertyBuildings['mediterranean-avenue']).toEqual({ houses: 0, hotels: 0 })
    expect(bankrupt.mortgagedProperties).toEqual([])
    expect(bankrupt.heldJailFreeCards).toEqual([])
    expect(bankrupt.decks.chance.at(-1)).toBe('chance-jail-free')
    expect(
      bankrupt.log.some(({ event }) => event.type === 'income' && event.reason === 'building-sale'),
    ).toBe(true)
    const bankruptcyPayment = bankrupt.log.find(
      ({ event }) => event.type === 'payment' && event.reason === 'bankruptcy',
    )
    expect(bankruptcyPayment?.event).toMatchObject({
      amount: 35,
      payerId: 'player-1',
      payeeId: null,
    })
    expect(
      bankrupt.log.some(
        ({ event }) => event.type === 'bankruptcy' && event.playerId === 'player-1',
      ),
    ).toBe(true)
    expect(bankrupt.auction).toMatchObject({
      propertyId: 'mediterranean-avenue',
      activeBidderId: 'player-2',
      biddingOrder: ['player-2'],
      bankruptcy: {
        debtorId: 'player-1',
        remainingPropertyIds: ['reading-railroad'],
      },
    })
    expect(bankrupt.phase).toBe('auction')
  })

  it('runs each bank asset auction in order and resumes on the next solvent player', () => {
    const firstAuction = gameReducer(createBankDebtState(), { type: 'declare-bankruptcy' })
    const secondAuction = gameReducer(firstAuction, { type: 'auction-pass' })

    expect(secondAuction.auction).toMatchObject({
      propertyId: 'reading-railroad',
      activeBidderId: 'player-2',
      bankruptcy: { debtorId: 'player-1', remainingPropertyIds: [] },
    })
    expect(secondAuction.ownership['mediterranean-avenue']).toBeNull()

    const finished = gameReducer(secondAuction, { type: 'auction-bid', amount: 25 })
    expect(finished.auction).toBeNull()
    expect(finished.ownership['reading-railroad']).toBe('player-2')
    expect(finished.currentPlayerIndex).toBe(1)
    expect(finished.phase).toBe('awaiting-roll')
    expect(finished.debtResolution).toBeNull()
    expect(finished.bankruptPlayerIds).toEqual(['player-1'])
  })

  it('rejects bankruptcy outside eligible bank debt and retains a playable turn without assets', () => {
    const invalid = createInitialGameState(setup)
    expect(gameReducer(invalid, { type: 'declare-bankruptcy' })).toBe(invalid)

    const noAssets: GameState = {
      ...createBankDebtState(),
      ownership: createInitialGameState(setup).ownership,
      mortgagedProperties: [],
      propertyBuildings: createInitialGameState(setup).propertyBuildings,
    }
    const resolved = gameReducer(noAssets, { type: 'declare-bankruptcy' })
    expect(resolved.auction).toBeNull()
    expect(resolved.currentPlayerIndex).toBe(1)
    expect(resolved.phase).toBe('awaiting-roll')
  })
})
