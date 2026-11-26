import { BOARD_SPACES } from './board'
import { getBuildingSaleEligibility, TOTAL_HOUSE_SUPPLY } from './building-eligibility'
import type { GameState, PlayerId } from './model'
import { STREET_PROPERTIES } from './street-data'

export function canDeclareBankruptcyToBank(state: GameState, playerId: PlayerId): boolean {
  const debt = state.debtResolution
  const debtor = state.players.find((player) => player.id === playerId)

  if (
    state.phase !== 'awaiting-player-action' ||
    !debt ||
    debt.debtorId !== playerId ||
    debt.creditorId !== null ||
    !debtor ||
    state.bankruptPlayerIds.includes(playerId) ||
    (debt.reason === 'jail-bail' && debtor.getOutOfJailFreeCardCount > 0) ||
    debtor.cash >= debt.amount
  ) {
    return false
  }

  const housesInUse = Object.values(state.propertyBuildings).reduce(
    (total, buildings) => total + buildings.houses,
    0,
  )
  const canSellBuilding = STREET_PROPERTIES.some((property) => {
    const buildings = state.propertyBuildings[property.id]
    if (
      state.ownership[property.id] !== playerId ||
      !buildings ||
      !getBuildingSaleEligibility({
        playerId,
        propertyId: property.id,
        ownership: state.ownership,
        mortgagedProperties: state.mortgagedProperties,
        propertyBuildings: state.propertyBuildings,
      }).eligible
    ) {
      return false
    }

    return buildings.hotels === 0 || housesInUse + 4 <= TOTAL_HOUSE_SUPPLY
  })
  if (canSellBuilding) return false

  const canMortgageProperty = BOARD_SPACES.some((space) => {
    if (
      (space.kind !== 'property' && space.kind !== 'railroad' && space.kind !== 'utility') ||
      state.ownership[space.id] !== playerId ||
      state.mortgagedProperties.includes(space.id)
    ) {
      return false
    }

    if (space.kind !== 'property') return true

    return !STREET_PROPERTIES.some((property) => {
      const buildings = state.propertyBuildings[property.id]
      return (
        property.group === space.group &&
        state.ownership[property.id] === playerId &&
        Boolean(buildings && (buildings.houses > 0 || buildings.hotels > 0))
      )
    })
  })

  return !canMortgageProperty
}
