export type CardDestination =
  'go' | 'illinois-avenue' | 'st-charles-place' | 'reading-railroad' | 'boardwalk'

export type CardEffect =
  | { type: 'cash'; direction: 'collect' | 'pay'; amount: number }
  | { type: 'collect-from-each-opponent'; amount: number }
  | { type: 'pay-each-opponent'; amount: number }
  | { type: 'repairs'; houseCost: number; hotelCost: number }
  | { type: 'get-out-of-jail-free' }
  | {
      type: 'advance-to'
      destination: CardDestination
      goSalary: 'always' | 'if-passed' | 'never'
    }
  | { type: 'advance-to-nearest-railroad'; rentMultiplier: 2; goSalary: 'if-passed' }
  | { type: 'advance-to-nearest-utility'; rentMultiplier: 10; goSalary: 'if-passed' }
  | { type: 'move-back'; spaces: 3 }
  | { type: 'go-to-jail' }

export interface CardDefinition {
  id: string
  text: string
  effect: CardEffect
}

export const CHANCE_CARDS = [
  {
    id: 'chance-advance-go',
    text: 'Advance to GO. Collect $200.',
    effect: { type: 'advance-to', destination: 'go', goSalary: 'always' },
  },
  {
    id: 'chance-advance-illinois-avenue',
    text: 'Advance to Illinois Avenue. If you pass GO, collect $200.',
    effect: { type: 'advance-to', destination: 'illinois-avenue', goSalary: 'if-passed' },
  },
  {
    id: 'chance-advance-st-charles-place',
    text: 'Advance to St. Charles Place. If you pass GO, collect $200.',
    effect: { type: 'advance-to', destination: 'st-charles-place', goSalary: 'if-passed' },
  },
  {
    id: 'chance-nearest-utility',
    text: 'Advance to the nearest Utility. If unowned, you may buy it; if owned, pay 10 times the dice roll.',
    effect: { type: 'advance-to-nearest-utility', rentMultiplier: 10, goSalary: 'if-passed' },
  },
  {
    id: 'chance-nearest-railroad-double-rent',
    text: 'Advance to the nearest Railroad. If owned, pay twice the rent; if unowned, you may buy it.',
    effect: { type: 'advance-to-nearest-railroad', rentMultiplier: 2, goSalary: 'if-passed' },
  },
  {
    id: 'chance-bank-dividend',
    text: 'The bank pays you a dividend of $50.',
    effect: { type: 'cash', direction: 'collect', amount: 50 },
  },
  {
    id: 'chance-jail-free',
    text: 'Get Out of Jail Free. Keep this card until needed or sold.',
    effect: { type: 'get-out-of-jail-free' },
  },
  {
    id: 'chance-back-three',
    text: 'Go back three spaces.',
    effect: { type: 'move-back', spaces: 3 },
  },
  {
    id: 'chance-go-to-jail',
    text: 'Go directly to Jail. Do not pass GO and do not collect $200.',
    effect: { type: 'go-to-jail' },
  },
  {
    id: 'chance-general-repairs',
    text: 'Make general repairs on all your property: pay $25 per house and $100 per hotel.',
    effect: { type: 'repairs', houseCost: 25, hotelCost: 100 },
  },
  {
    id: 'chance-poor-tax',
    text: 'Pay poor tax of $15.',
    effect: { type: 'cash', direction: 'pay', amount: 15 },
  },
  {
    id: 'chance-reading-railroad',
    text: 'Take a trip to Reading Railroad. If you pass GO, collect $200.',
    effect: { type: 'advance-to', destination: 'reading-railroad', goSalary: 'if-passed' },
  },
  {
    id: 'chance-boardwalk',
    text: 'Take a walk on the Boardwalk. Advance to Boardwalk.',
    effect: { type: 'advance-to', destination: 'boardwalk', goSalary: 'never' },
  },
  {
    id: 'chance-chairman',
    text: 'You have been elected Chairman of the Board. Pay each player $50.',
    effect: { type: 'pay-each-opponent', amount: 50 },
  },
  {
    id: 'chance-building-loan',
    text: 'Your building loan matures. Collect $150.',
    effect: { type: 'cash', direction: 'collect', amount: 150 },
  },
  {
    id: 'chance-crossword-contest',
    text: 'You have won a crossword competition. Collect $100.',
    effect: { type: 'cash', direction: 'collect', amount: 100 },
  },
] as const satisfies readonly CardDefinition[]

export const COMMUNITY_CHEST_CARDS = [
  {
    id: 'community-chest-advance-go',
    text: 'Advance to GO. Collect $200.',
    effect: { type: 'advance-to', destination: 'go', goSalary: 'always' },
  },
  {
    id: 'community-chest-bank-error',
    text: 'Bank error in your favor. Collect $200.',
    effect: { type: 'cash', direction: 'collect', amount: 200 },
  },
  {
    id: 'community-chest-doctors-fees',
    text: 'Doctor’s fees. Pay $50.',
    effect: { type: 'cash', direction: 'pay', amount: 50 },
  },
  {
    id: 'community-chest-stock-sale',
    text: 'From sale of stock you get $50.',
    effect: { type: 'cash', direction: 'collect', amount: 50 },
  },
  {
    id: 'community-chest-jail-free',
    text: 'Get Out of Jail Free. Keep this card until needed or sold.',
    effect: { type: 'get-out-of-jail-free' },
  },
  {
    id: 'community-chest-go-to-jail',
    text: 'Go to Jail. Go directly to Jail. Do not pass GO and do not collect $200.',
    effect: { type: 'go-to-jail' },
  },
  {
    id: 'community-chest-holiday-fund',
    text: 'Holiday fund matures. Collect $100.',
    effect: { type: 'cash', direction: 'collect', amount: 100 },
  },
  {
    id: 'community-chest-income-tax-refund',
    text: 'Income tax refund. Collect $20.',
    effect: { type: 'cash', direction: 'collect', amount: 20 },
  },
  {
    id: 'community-chest-birthday',
    text: 'It is your birthday. Collect $10 from every player.',
    effect: { type: 'collect-from-each-opponent', amount: 10 },
  },
  {
    id: 'community-chest-life-insurance',
    text: 'Life insurance matures. Collect $100.',
    effect: { type: 'cash', direction: 'collect', amount: 100 },
  },
  {
    id: 'community-chest-hospital-fees',
    text: 'Pay hospital fees of $100.',
    effect: { type: 'cash', direction: 'pay', amount: 100 },
  },
  {
    id: 'community-chest-school-fees',
    text: 'Pay school fees of $50.',
    effect: { type: 'cash', direction: 'pay', amount: 50 },
  },
  {
    id: 'community-chest-consultancy-fee',
    text: 'Receive $25 consultancy fee.',
    effect: { type: 'cash', direction: 'collect', amount: 25 },
  },
  {
    id: 'community-chest-street-repairs',
    text: 'You are assessed for street repairs: pay $40 per house and $115 per hotel.',
    effect: { type: 'repairs', houseCost: 40, hotelCost: 115 },
  },
  {
    id: 'community-chest-beauty-contest',
    text: 'You have won second prize in a beauty contest. Collect $10.',
    effect: { type: 'cash', direction: 'collect', amount: 10 },
  },
  {
    id: 'community-chest-inherit',
    text: 'You inherit $100.',
    effect: { type: 'cash', direction: 'collect', amount: 100 },
  },
] as const satisfies readonly CardDefinition[]
