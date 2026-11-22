export type PropertyGroup =
  'brown' | 'light-blue' | 'pink' | 'orange' | 'red' | 'yellow' | 'green' | 'dark-blue'

export type CardDeck = 'chance' | 'community-chest'
export type TaxKind = 'income' | 'luxury'
export type CornerKind = 'go' | 'jail' | 'go-to-jail'
export type UtilityKind = 'electric-company' | 'water-works'

export interface BoardSpaceBase {
  id: string
  position: number
  name: string
}

export interface PropertySpace extends BoardSpaceBase {
  kind: 'property'
  group: PropertyGroup
}

export interface RailroadSpace extends BoardSpaceBase {
  kind: 'railroad'
}

export interface UtilitySpace extends BoardSpaceBase {
  kind: 'utility'
  utility: UtilityKind
}

export interface TaxSpace extends BoardSpaceBase {
  kind: 'tax'
  tax: TaxKind
}

export interface CardSpace extends BoardSpaceBase {
  kind: 'card'
  deck: CardDeck
}

export interface CornerSpace extends BoardSpaceBase {
  kind: 'corner'
  corner: CornerKind
}

export interface ParkingSpace extends BoardSpaceBase {
  kind: 'parking'
}

export type BoardSpace =
  PropertySpace | RailroadSpace | UtilitySpace | TaxSpace | CardSpace | CornerSpace | ParkingSpace
