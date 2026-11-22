import type { PropertyGroup, PropertySpace } from './board-space'

/**
 * Classic U.S. street-deed values. The schedule is transcribed from the Drexel table
 * and cross-checked against MonopolyClub's classic board reference. Full-set rent is
 * twice unimproved rent under Hasbro's standard rules.
 * https://www.cs.drexel.edu/~popyack/Courses/CSP/Wi18/assignments/HW5/MonopolyBoard_prices.html
 * https://monopolyclub.com/rules/classic/board-layout
 * https://www.hasbro.com/common/instruct/Monopoly_Vintage.pdf
 */
export interface StreetProperty extends PropertySpace {
  readonly purchasePrice: number
  readonly mortgageValue: number
  readonly houseCost: number
  readonly rents: {
    readonly base: number
    readonly completeGroup: number
    readonly houses: readonly [number, number, number, number]
    readonly hotel: number
  }
}

function street(
  id: string,
  name: string,
  position: number,
  group: PropertyGroup,
  purchasePrice: number,
  houseCost: number,
  baseRent: number,
  houseRents: readonly [number, number, number, number],
  hotelRent: number,
): StreetProperty {
  return {
    id,
    name,
    position,
    kind: 'property',
    group,
    purchasePrice,
    mortgageValue: purchasePrice / 2,
    houseCost,
    rents: {
      base: baseRent,
      completeGroup: baseRent * 2,
      houses: houseRents,
      hotel: hotelRent,
    },
  }
}

export const STREET_PROPERTIES = [
  street(
    'mediterranean-avenue',
    'Mediterranean Avenue',
    1,
    'brown',
    60,
    50,
    2,
    [10, 30, 90, 160],
    250,
  ),
  street('baltic-avenue', 'Baltic Avenue', 3, 'brown', 60, 50, 4, [20, 60, 180, 320], 450),
  street(
    'oriental-avenue',
    'Oriental Avenue',
    6,
    'light-blue',
    100,
    50,
    6,
    [30, 90, 270, 400],
    550,
  ),
  street('vermont-avenue', 'Vermont Avenue', 8, 'light-blue', 100, 50, 6, [30, 90, 270, 400], 550),
  street(
    'connecticut-avenue',
    'Connecticut Avenue',
    9,
    'light-blue',
    120,
    50,
    8,
    [40, 100, 300, 450],
    600,
  ),
  street(
    'st-charles-place',
    'St. Charles Place',
    11,
    'pink',
    140,
    100,
    10,
    [50, 150, 450, 625],
    750,
  ),
  street('states-avenue', 'States Avenue', 13, 'pink', 140, 100, 10, [50, 150, 450, 625], 750),
  street('virginia-avenue', 'Virginia Avenue', 14, 'pink', 160, 100, 12, [60, 180, 500, 700], 900),
  street('st-james-place', 'St. James Place', 16, 'orange', 180, 100, 14, [70, 200, 550, 750], 950),
  street(
    'tennessee-avenue',
    'Tennessee Avenue',
    18,
    'orange',
    180,
    100,
    14,
    [70, 200, 550, 750],
    950,
  ),
  street(
    'new-york-avenue',
    'New York Avenue',
    19,
    'orange',
    200,
    100,
    16,
    [80, 220, 600, 800],
    1000,
  ),
  street('kentucky-avenue', 'Kentucky Avenue', 21, 'red', 220, 150, 18, [90, 250, 700, 875], 1050),
  street('indiana-avenue', 'Indiana Avenue', 23, 'red', 220, 150, 18, [90, 250, 700, 875], 1050),
  street('illinois-avenue', 'Illinois Avenue', 24, 'red', 240, 150, 20, [100, 300, 750, 925], 1100),
  street(
    'atlantic-avenue',
    'Atlantic Avenue',
    26,
    'yellow',
    260,
    150,
    22,
    [110, 330, 800, 975],
    1150,
  ),
  street(
    'ventnor-avenue',
    'Ventnor Avenue',
    27,
    'yellow',
    260,
    150,
    22,
    [110, 330, 800, 975],
    1150,
  ),
  street(
    'marvin-gardens',
    'Marvin Gardens',
    29,
    'yellow',
    280,
    150,
    24,
    [120, 360, 850, 1025],
    1200,
  ),
  street(
    'pacific-avenue',
    'Pacific Avenue',
    31,
    'green',
    300,
    200,
    26,
    [130, 390, 900, 1100],
    1275,
  ),
  street(
    'north-carolina-avenue',
    'North Carolina Avenue',
    32,
    'green',
    300,
    200,
    26,
    [130, 390, 900, 1100],
    1275,
  ),
  street(
    'pennsylvania-avenue',
    'Pennsylvania Avenue',
    34,
    'green',
    320,
    200,
    28,
    [150, 450, 1000, 1200],
    1400,
  ),
  street('park-place', 'Park Place', 37, 'dark-blue', 350, 200, 35, [175, 500, 1100, 1300], 1500),
  street('boardwalk', 'Boardwalk', 39, 'dark-blue', 400, 200, 50, [200, 600, 1400, 1700], 2000),
] as const satisfies readonly StreetProperty[]
