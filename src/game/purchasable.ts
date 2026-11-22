import { RAILROADS } from './railroad-data'
import type { RailroadProperty } from './railroad-data'
import { STREET_PROPERTIES } from './street-data'
import type { StreetProperty } from './street-data'
import { UTILITIES } from './utility-data'
import type { UtilityProperty } from './utility-data'

export type PurchasableDeed = Pick<
  StreetProperty | RailroadProperty | UtilityProperty,
  'id' | 'name' | 'purchasePrice'
>

const PURCHASABLE_DEEDS: readonly PurchasableDeed[] = [
  ...STREET_PROPERTIES,
  ...RAILROADS,
  ...UTILITIES,
]

export function getPurchasableDeedById(propertyId: string): PurchasableDeed | undefined {
  return PURCHASABLE_DEEDS.find((deed) => deed.id === propertyId)
}
