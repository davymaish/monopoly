import { describe, expect, it } from 'vitest'
import { getHouseBuildingEligibility } from '../game/building-eligibility'
import { createInitialGameState } from '../game/initial-state'
import type { PropertyBuildings } from '../game/model'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function checkHouseEligibility(
  propertyId: string,
  houseCounts: Record<string, number>,
  ownershipOverrides: Record<string, string | null>,
) {
  const state = createInitialGameState(setup, () => 0)
  const propertyBuildings: PropertyBuildings = {
    ...state.propertyBuildings,
    ...Object.fromEntries(
      Object.entries(houseCounts).map(([id, houses]) => [id, { houses, hotels: 0 }]),
    ),
  }

  return getHouseBuildingEligibility({
    playerId: 'player-1',
    propertyId,
    ownership: { ...state.ownership, ...ownershipOverrides },
    mortgagedProperties: [],
    propertyBuildings,
  })
}

describe('even house building', () => {
  const brownGroup = {
    'mediterranean-avenue': 'player-1',
    'baltic-avenue': 'player-1',
  }

  it('allows adding one house to a property at the group minimum', () => {
    expect(
      checkHouseEligibility(
        'baltic-avenue',
        { 'mediterranean-avenue': 2, 'baltic-avenue': 1 },
        brownGroup,
      ),
    ).toEqual({ eligible: true, reason: null })
  })

  it('blocks another house when it would leave the group more than one house apart', () => {
    expect(
      checkHouseEligibility(
        'mediterranean-avenue',
        { 'mediterranean-avenue': 3, 'baltic-avenue': 1 },
        brownGroup,
      ),
    ).toEqual({ eligible: false, reason: 'uneven-group-development' })
  })

  it('applies the same even-building rule to three-property groups', () => {
    expect(
      checkHouseEligibility(
        'oriental-avenue',
        {
          'oriental-avenue': 1,
          'vermont-avenue': 3,
          'connecticut-avenue': 2,
        },
        {
          'oriental-avenue': 'player-1',
          'vermont-avenue': 'player-1',
          'connecticut-avenue': 'player-1',
        },
      ),
    ).toEqual({ eligible: true, reason: null })
  })

  it('rejects a build that leaves the projected group more than one house apart', () => {
    expect(
      checkHouseEligibility(
        'oriental-avenue',
        {
          'oriental-avenue': 1,
          'vermont-avenue': 1,
          'connecticut-avenue': 3,
        },
        {
          'oriental-avenue': 'player-1',
          'vermont-avenue': 'player-1',
          'connecticut-avenue': 'player-1',
        },
      ),
    ).toEqual({ eligible: false, reason: 'uneven-group-development' })
  })

  it('still blocks uneven development when the player does not own the complete group', () => {
    expect(
      checkHouseEligibility(
        'mediterranean-avenue',
        { 'mediterranean-avenue': 1, 'baltic-avenue': 0 },
        { 'mediterranean-avenue': 'player-1' },
      ),
    ).toEqual({ eligible: false, reason: 'incomplete-group' })
  })
})
