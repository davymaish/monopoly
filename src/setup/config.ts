export const PLAYER_COUNTS = [2, 3, 4] as const
export type PlayerCount = (typeof PLAYER_COUNTS)[number]

export const MAX_PLAYER_NAME_LENGTH = 20

export const PLAYER_COLOR_IDS = [
  'red',
  'blue',
  'green',
  'purple',
  'orange',
  'teal',
  'gold',
  'charcoal',
] as const
export type PlayerColor = (typeof PLAYER_COLOR_IDS)[number]

export function isPlayerCount(value: number): value is PlayerCount {
  return PLAYER_COUNTS.some((count) => count === value)
}
