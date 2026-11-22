import { PROPERTY_GROUPS } from '../game/property-groups'
import type { Player } from '../game/model'
import type { RailroadProperty } from '../game/railroad-data'
import type { StreetProperty } from '../game/street-data'
import type { UtilityProperty } from '../game/utility-data'
import { PLAYER_TOKEN_COLORS } from './PlayerColorSelector'

export type PropertyDeed = StreetProperty | RailroadProperty | UtilityProperty

interface PropertyDetailCardProps {
  owner?: Pick<Player, 'color' | 'name'> | null
  property: PropertyDeed | null
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="property-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function formatMoney(value: number): string {
  return `$${value.toLocaleString('en-US')}`
}

export default function PropertyDetailCard({ property, owner = null }: PropertyDetailCardProps) {
  const ownerColor = owner
    ? PLAYER_TOKEN_COLORS.find((color) => color.id === owner.color)
    : undefined

  return (
    <aside
      className="property-detail-card"
      aria-labelledby="property-detail-heading"
      aria-live="polite"
    >
      <h2 id="property-detail-heading">Property details</h2>
      {property ? (
        <>
          <div className="property-detail-heading">
            <h3>{property.name}</h3>
            {property.kind === 'property' && <p>{PROPERTY_GROUPS[property.group].label} street</p>}
            {property.kind === 'railroad' && <p>Railroad</p>}
            {property.kind === 'utility' && <p>Utility</p>}
            <p className="property-detail-owner">
              {owner && (
                <span
                  aria-hidden="true"
                  className="property-detail-owner-swatch"
                  style={{ backgroundColor: ownerColor?.hex ?? 'transparent' }}
                />
              )}
              {owner ? `Owned by ${owner.name}` : 'Unowned'}
            </p>
          </div>
          <dl className="property-detail-values">
            <DetailRow label="Purchase price" value={formatMoney(property.purchasePrice)} />
            <DetailRow label="Mortgage value" value={formatMoney(property.mortgageValue)} />
            {property.kind === 'property' && (
              <>
                <DetailRow label="Base rent" value={formatMoney(property.rents.base)} />
                <DetailRow
                  label="Complete-group rent"
                  value={formatMoney(property.rents.completeGroup)}
                />
                {property.rents.houses.map((rent, index) => (
                  <DetailRow
                    key={index}
                    label={`Rent with ${index + 1} ${index === 0 ? 'house' : 'houses'}`}
                    value={formatMoney(rent)}
                  />
                ))}
                <DetailRow label="Rent with hotel" value={formatMoney(property.rents.hotel)} />
                <DetailRow label="House cost" value={formatMoney(property.houseCost)} />
              </>
            )}
            {property.kind === 'railroad' &&
              property.rentByRailroadsOwned.map((rent, index) => (
                <DetailRow
                  key={index}
                  label={`Rent with ${index + 1} ${index === 0 ? 'railroad' : 'railroads'}`}
                  value={formatMoney(rent)}
                />
              ))}
            {property.kind === 'utility' && (
              <>
                <DetailRow
                  label="Rent with one utility"
                  value={`${property.rentMultipliers.oneUtility}× dice total`}
                />
                <DetailRow
                  label="Rent with both utilities"
                  value={`${property.rentMultipliers.bothUtilities}× dice total`}
                />
              </>
            )}
          </dl>
        </>
      ) : (
        <p className="property-detail-empty">
          Hover over, focus, or select a purchasable space to view its deed details.
        </p>
      )}
    </aside>
  )
}
