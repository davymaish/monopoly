import { describe, expect, it } from 'vitest'
import { appendGameLog } from '../game/log'
import type { GameLogEvent } from '../game/model'

describe('appendGameLog', () => {
  it('appends typed events in order with deterministic unique IDs without mutating prior entries', () => {
    const roll: GameLogEvent = { type: 'roll', playerId: 'player-1', dice: [2, 5] }
    const payment: GameLogEvent = {
      type: 'payment',
      payerId: 'player-1',
      payeeId: 'player-2',
      amount: 35,
      reason: 'rent',
    }
    const firstLog = appendGameLog([], [roll])
    const nextLog = appendGameLog(firstLog, [
      payment,
      { type: 'turn-change', fromPlayerId: 'player-1', toPlayerId: 'player-2' },
    ])

    expect(firstLog).toEqual([{ id: 'log-1', event: roll }])
    expect(nextLog).toEqual([
      { id: 'log-1', event: roll },
      { id: 'log-2', event: payment },
      {
        id: 'log-3',
        event: { type: 'turn-change', fromPlayerId: 'player-1', toPlayerId: 'player-2' },
      },
    ])
    expect(nextLog).not.toBe(firstLog)
  })
})
