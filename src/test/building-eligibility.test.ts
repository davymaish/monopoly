import { describe, expect, it } from 'vitest'
import { getBuildingEligibility } from '../game/building-eligibility'
import { createInitialGameState } from '../game/initial-state'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function checkBuildingEligibility(
  propertyId: string,
  ownershipOverrides: Record<string, string | null> = {},
  mortgagedProperties: string[] = [],
) {
  const state = createInitialGameState(setup, () => 0)
  return getBuildingEligibility({
    playerId: 'player-1',
    propertyId,
    ownership: { ...state.ownership, ...ownershipOverrides },
    mortgagedProperties,
  })
}

describe('building eligibility', () => {
  it('allows building when the player owns the complete unmortgaged color group', () => {
    expect(
      checkBuildingEligibility('mediterranean-avenue', {
        'mediterranean-avenue': 'player-1',
        'baltic-avenue': 'player-1',
      }),
    ).toEqual({ eligible: true, reason: null })
  })

  it.each([
    ['baltic-avenue', null],
    ['baltic-avenue', 'player-2'],
  ] as const)(
    'blocks building when group member %s is not fully owned by the player',
    (id, ownerId) => {
      expect(
        checkBuildingEligibility('mediterranean-avenue', {
          'mediterranean-avenue': 'player-1',
          [id]: ownerId,
        }),
      ).toEqual({ eligible: false, reason: 'incomplete-group' })
    },
  )

  it.each(['mediterranean-avenue', 'baltic-avenue'])(
    'blocks building when %s in the owned group is mortgaged',
    (mortgagedPropertyId) => {
      expect(
        checkBuildingEligibility(
          'mediterranean-avenue',
          {
            'mediterranean-avenue': 'player-1',
            'baltic-avenue': 'player-1',
          },
          [mortgagedPropertyId],
        ),
      ).toEqual({ eligible: false, reason: 'mortgaged-group' })
    },
  )

  it('requires the target street to belong to the building player', () => {
    expect(checkBuildingEligibility('mediterranean-avenue')).toEqual({
      eligible: false,
      reason: 'not-owner',
    })
  })

  it('does not treat non-street spaces as buildable properties', () => {
    expect(checkBuildingEligibility('electric-company')).toEqual({
      eligible: false,
      reason: 'not-a-street',
    })
    expect(checkBuildingEligibility('go')).toEqual({
      eligible: false,
      reason: 'not-a-street',
    })
  })

  it('ignores a mortgage outside the target color group', () => {
    expect(
      checkBuildingEligibility(
        'mediterranean-avenue',
        {
          'mediterranean-avenue': 'player-1',
          'baltic-avenue': 'player-1',
        },
        ['oriental-avenue'],
      ),
    ).toEqual({ eligible: true, reason: null })
  })
})
