import type { GameLogEntry, GameLogEvent } from './model'

export function appendGameLog(
  log: readonly GameLogEntry[],
  events: readonly GameLogEvent[],
): GameLogEntry[] {
  return [...log, ...events.map((event, index) => ({ id: `log-${log.length + index + 1}`, event }))]
}
