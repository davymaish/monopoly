import type { ReactElement } from 'react'
import { BOARD_SPACES } from '../game/board'
import type { BoardSpace } from '../game/board-space'
import {
  getBuildingSaleEligibility,
  getHouseBuildingEligibility,
  getHotelBuildingEligibility,
  TOTAL_HOTEL_SUPPLY,
  TOTAL_HOUSE_SUPPLY,
} from '../game/building-eligibility'
import type { GameAction } from '../game/actions'
import type { GameState } from '../game/model'
import { PROPERTY_GROUPS } from '../game/property-groups'
import { getPurchasableDeedById } from '../game/purchasable'
import { STREET_PROPERTIES } from '../game/street-data'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

type PurchasableSpace = Extract<BoardSpace, { kind: 'property' | 'railroad' | 'utility' }>

function isPurchasableSpace(space: BoardSpace): space is PurchasableSpace {
  return space.kind === 'property' || space.kind === 'railroad' || space.kind === 'utility'
}

interface PropertyManagementPanelProps {
  gameState: GameState
  onAction: (action: GameAction) => void
}

export default function PropertyManagementPanel({
  gameState,
  onAction,
}: PropertyManagementPanelProps): ReactElement {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const canManageProperties =
    (gameState.phase === 'awaiting-roll' || gameState.phase === 'awaiting-player-action') &&
    gameState.pendingCard === null &&
    gameState.debtResolution === null
  const housesInUse = Object.values(gameState.propertyBuildings).reduce(
    (total, buildings) => total + buildings.houses,
    0,
  )
  const hotelsInUse = Object.values(gameState.propertyBuildings).reduce(
    (total, buildings) => total + buildings.hotels,
    0,
  )
  const ownedSpaces = currentPlayer
    ? BOARD_SPACES.filter(
        (space): space is PurchasableSpace =>
          isPurchasableSpace(space) && gameState.ownership[space.id] === currentPlayer.id,
      )
    : []

  return (
    <section className="property-management-panel" aria-labelledby="property-management-heading">
      <h2 id="property-management-heading">Property management</h2>
      {currentPlayer ? (
        <p className="property-management-current-player">Current player: {currentPlayer.name}</p>
      ) : null}
      {ownedSpaces.length > 0 && currentPlayer ? (
        <ul
          aria-label={`${currentPlayer.name}'s owned properties`}
          className="property-management-list"
        >
          {ownedSpaces.map((space) => {
            const deed = getPurchasableDeedById(space.id)
            if (!deed || !currentPlayer) return null

            const street =
              space.kind === 'property'
                ? STREET_PROPERTIES.find((property) => property.id === space.id)
                : undefined
            const buildings = gameState.propertyBuildings[space.id]
            const isMortgaged = gameState.mortgagedProperties.includes(space.id)
            const groupHasBuildings =
              street !== undefined &&
              STREET_PROPERTIES.some((property) => {
                const groupBuildings = gameState.propertyBuildings[property.id]
                return (
                  property.group === street.group &&
                  (groupBuildings.houses > 0 || groupBuildings.hotels > 0)
                )
              })
            const buildingInput = {
              playerId: currentPlayer.id,
              propertyId: space.id,
              ownership: gameState.ownership,
              mortgagedProperties: gameState.mortgagedProperties,
              propertyBuildings: gameState.propertyBuildings,
            }
            const houseEligibility = street
              ? getHouseBuildingEligibility(buildingInput)
              : { eligible: false, reason: 'not-a-street' as const }
            const hotelEligibility = street
              ? getHotelBuildingEligibility(buildingInput)
              : { eligible: false, reason: 'not-a-street' as const }
            const saleEligibility = street
              ? getBuildingSaleEligibility(buildingInput)
              : { eligible: false, reason: 'not-a-street' as const }
            const canBuildHouse =
              canManageProperties &&
              street !== undefined &&
              buildings !== undefined &&
              houseEligibility.eligible &&
              buildings.houses < 4 &&
              buildings.hotels === 0 &&
              housesInUse < TOTAL_HOUSE_SUPPLY &&
              currentPlayer.cash >= street.houseCost
            const canBuildHotel =
              canManageProperties &&
              street !== undefined &&
              buildings !== undefined &&
              hotelEligibility.eligible &&
              currentPlayer.cash >= street.houseCost &&
              hotelsInUse < TOTAL_HOTEL_SUPPLY
            const canSellBuilding =
              canManageProperties &&
              street !== undefined &&
              buildings !== undefined &&
              saleEligibility.eligible &&
              (buildings.hotels === 0 || housesInUse + 4 <= TOTAL_HOUSE_SUPPLY)
            const canMortgage = canManageProperties && !isMortgaged && !groupHasBuildings
            const redemptionAmount = deed.mortgageValue + Math.ceil(deed.mortgageValue / 10)
            const canUnmortgage =
              canManageProperties && isMortgaged && currentPlayer.cash >= redemptionAmount
            const propertyCategory =
              space.kind === 'property'
                ? `${PROPERTY_GROUPS[space.group].label} street`
                : space.kind === 'railroad'
                  ? 'Railroad'
                  : 'Utility'
            const buildingStatus =
              space.kind !== 'property'
                ? propertyCategory
                : buildings?.hotels
                  ? '1 hotel'
                  : buildings?.houses
                    ? `${buildings.houses} ${buildings.houses === 1 ? 'house' : 'houses'}`
                    : 'No buildings'

            return (
              <li className="property-management-card" key={space.id}>
                <div className="property-management-details">
                  <h3>{space.name}</h3>
                  <p>{buildingStatus}</p>
                  <p>{isMortgaged ? 'Mortgaged — rent is not collected' : 'Not mortgaged'}</p>
                </div>
                {(canBuildHouse ||
                  canBuildHotel ||
                  canSellBuilding ||
                  canMortgage ||
                  canUnmortgage) && (
                  <div
                    aria-label={`Actions for ${space.name}`}
                    className="property-management-actions"
                  >
                    {canBuildHouse && (
                      <button
                        aria-label={`Build house on ${space.name}`}
                        className="property-management-button"
                        onClick={() => onAction({ type: 'build-house', propertyId: space.id })}
                        type="button"
                      >
                        Build house · {currencyFormatter.format(street.houseCost)}
                      </button>
                    )}
                    {canBuildHotel && (
                      <button
                        aria-label={`Build hotel on ${space.name}`}
                        className="property-management-button"
                        onClick={() => onAction({ type: 'build-hotel', propertyId: space.id })}
                        type="button"
                      >
                        Build hotel · {currencyFormatter.format(street.houseCost)}
                      </button>
                    )}
                    {canSellBuilding && (
                      <button
                        aria-label={`Sell building on ${space.name}`}
                        className="property-management-button property-management-button--secondary"
                        onClick={() => onAction({ type: 'sell-building', propertyId: space.id })}
                        type="button"
                      >
                        Sell building
                      </button>
                    )}
                    {canMortgage && (
                      <button
                        aria-label={`Mortgage ${space.name} for ${currencyFormatter.format(deed.mortgageValue)}`}
                        className="property-management-button property-management-button--secondary"
                        onClick={() =>
                          onAction({ type: 'mortgage-property', propertyId: space.id })
                        }
                        type="button"
                      >
                        Mortgage · {currencyFormatter.format(deed.mortgageValue)}
                      </button>
                    )}
                    {canUnmortgage && (
                      <button
                        aria-label={`Unmortgage ${space.name} for ${currencyFormatter.format(redemptionAmount)}`}
                        className="property-management-button property-management-button--secondary"
                        onClick={() =>
                          onAction({ type: 'unmortgage-property', propertyId: space.id })
                        }
                        type="button"
                      >
                        Unmortgage · {currencyFormatter.format(redemptionAmount)}
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="property-management-empty">
          {currentPlayer
            ? `${currentPlayer.name} has no owned properties yet.`
            : 'No active player.'}
        </p>
      )}
    </section>
  )
}
