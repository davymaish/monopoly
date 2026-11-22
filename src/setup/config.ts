export const PLAYER_COUNTS = [2, 3, 4] as const
export type PlayerCount = (typeof PLAYER_COUNTS)[number]

export const MAX_PLAYER_NAME_LENGTH = 20

export function isPlayerCount(value: number): value is PlayerCount {
  return PLAYER_COUNTS.some((count) => count === value)
}
