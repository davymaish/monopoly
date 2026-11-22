import { BOARD_SPACES } from '../game/board'

export interface GridCoordinates {
  row: number
  column: number
}

export function getBoardGridCoordinates(position: number): GridCoordinates {
  if (!Number.isInteger(position) || position < 0 || position > 39) {
    throw new RangeError(`Board position must be between 0 and 39; received ${position}.`)
  }

  if (position <= 10) {
    return { row: 10, column: 10 - position }
  }

  if (position <= 20) {
    return { row: 20 - position, column: 0 }
  }

  if (position <= 30) {
    return { row: 0, column: position - 20 }
  }

  return { row: position - 30, column: 10 }
}

export default function BoardPerimeter() {
  return (
    <div className="board-perimeter" role="list" aria-label="Monopoly board">
      <div className="board-center" aria-hidden="true">
        <span className="board-center-label">Monopoly</span>
      </div>
      {BOARD_SPACES.map((space) => {
        const { row, column } = getBoardGridCoordinates(space.position)
        const isTopEdge = space.position >= 20 && space.position < 30
        const isRightEdge = space.position >= 30
        const edge = isTopEdge ? 'top' : isRightEdge ? 'right' : undefined
        const isProperty = space.kind === 'property'
        const tileClassName = edge ? `board-tile board-tile--${edge}` : 'board-tile'

        return (
          <div
            key={space.id}
            className={tileClassName}
            role="listitem"
            aria-label={`${space.name}, space ${space.position + 1}`}
            data-position={space.position}
            data-grid-row={row}
            data-grid-column={column}
            data-kind={space.kind}
            data-edge={edge}
            data-group={isProperty ? space.group : undefined}
            style={{ gridRow: row + 1, gridColumn: column + 1 }}
          >
            {isTopEdge && (
              <span className="board-tile-top-content" aria-hidden="true">
                {isProperty && <span className="board-tile-band" />}
                <span className="board-tile-name">{space.name}</span>
              </span>
            )}
            {isRightEdge && (
              <span className="board-tile-right-content" aria-hidden="true">
                <span className="board-tile-name board-tile-name--right">{space.name}</span>
                {isProperty && <span className="board-tile-band board-tile-band--right" />}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
