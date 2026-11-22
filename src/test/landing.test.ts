import { describe, expect, it } from 'vitest'
import { BOARD_SPACES } from '../game/board'
import { resolveLanding } from '../game/landing'
import { createInitialPropertyOwnership } from '../game/ownership'
import type { BoardSpace } from '../game/board-space'

const playerIds = ['player-1', 'player-2']

function getSpace(id: string): BoardSpace {
  const space = BOARD_SPACES.find((boardSpace) => boardSpace.id === id)
  if (!space) {
    throw new Error(`Missing board space: ${id}`)
  }
  return space
}

describe('resolveLanding', () => {
  it('routes all 40 board spaces to explicit outcomes with legal actions', () => {
    const ownership = createInitialPropertyOwnership()
    const results = BOARD_SPACES.map((space) =>
      resolveLanding(space, ownership, playerIds, 'player-1'),
    )

    expect(results).toHaveLength(40)
    expect(results.every((result) => result.type !== 'unsupported')).toBe(true)
    expect(new Set(results.map((result) => result.type))).toEqual(
      new Set(['unowned-property', 'tax', 'card', 'go', 'jail-visit', 'go-to-jail', 'parking']),
    )
    expect(results.find((result) => result.type === 'unowned-property')?.legalActions).toEqual([
      'buy-property',
      'decline-purchase',
    ])
    expect(results.find((result) => result.type === 'tax')?.legalActions).toEqual(['pay-tax'])
    expect(results.find((result) => result.type === 'card')?.legalActions).toEqual(['draw-card'])
  })

  it('distinguishes a player-owned space from another player’s space', () => {
    const ownership = {
      ...createInitialPropertyOwnership(),
      'mediterranean-avenue': 'player-2',
    }

    expect(
      resolveLanding(getSpace('mediterranean-avenue'), ownership, playerIds, 'player-1'),
    ).toMatchObject({
      type: 'owned-property',
      ownerId: 'player-2',
      ownedByCurrentPlayer: false,
      legalActions: ['pay-rent'],
    })
    expect(
      resolveLanding(getSpace('mediterranean-avenue'), ownership, playerIds, 'player-2'),
    ).toMatchObject({
      type: 'owned-property',
      ownerId: 'player-2',
      ownedByCurrentPlayer: true,
      legalActions: ['continue'],
    })
  })

  it('returns safe fallback outcomes for missing spaces or invalid ownership data', () => {
    const ownership = createInitialPropertyOwnership()
    const missingOwnership = { ...ownership }
    delete missingOwnership['mediterranean-avenue']

    expect(resolveLanding(undefined, ownership, playerIds, 'player-1')).toMatchObject({
      type: 'unsupported',
      reason: 'unknown-space',
    })
    expect(
      resolveLanding(getSpace('mediterranean-avenue'), missingOwnership, playerIds, 'player-1'),
    ).toMatchObject({ type: 'unsupported', reason: 'ownership-missing' })
    expect(
      resolveLanding(
        getSpace('mediterranean-avenue'),
        { ...ownership, 'mediterranean-avenue': 'player-3' },
        playerIds,
        'player-1',
      ),
    ).toMatchObject({ type: 'unsupported', reason: 'invalid-owner' })
  })
})
