import { BOARD_SPACES } from '../game/board'
import type { BoardSpace } from '../game/board-space'
import { RAILROADS } from '../game/railroad-data'
import type { RailroadProperty } from '../game/railroad-data'
import { STREET_PROPERTIES } from '../game/street-data'
import type { StreetProperty } from '../game/street-data'
import { UTILITIES } from '../game/utility-data'
import type { UtilityProperty } from '../game/utility-data'
import type { PropertyDeed } from './PropertyDetailCard'

export interface GridCoordinates {
  row: number
  column: number
}

interface BoardPerimeterProps {
  onSelectDeed?: (deed: PropertyDeed) => void
  selectedDeedId?: string | null
}

function getPropertyDeed(space: BoardSpace): PropertyDeed | undefined {
  switch (space.kind) {
    case 'property':
      return STREET_PROPERTIES.find((deed: StreetProperty) => deed.id === space.id)
    case 'railroad':
      return RAILROADS.find((deed: RailroadProperty) => deed.id === space.id)
    case 'utility':
      return UTILITIES.find((deed: UtilityProperty) => deed.id === space.id)
    default:
      return undefined
  }
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

export default function BoardPerimeter({ onSelectDeed, selectedDeedId }: BoardPerimeterProps = {}) {
  return (
    <div className="board-perimeter" role="list" aria-label="Monopoly board">
      <div className="board-center" aria-hidden="true">
        <span className="board-center-label">Monopoly</span>
      </div>
      {BOARD_SPACES.map((space) => {
        const { row, column } = getBoardGridCoordinates(space.position)
        const isBottomEdge = space.position < 10
        const isLeftEdge = space.position >= 10 && space.position < 20
        const isTopEdge = space.position >= 20 && space.position < 30
        const isRightEdge = space.position >= 30
        const edge = isBottomEdge
          ? 'bottom'
          : isLeftEdge
            ? 'left'
            : isTopEdge
              ? 'top'
              : isRightEdge
                ? 'right'
                : undefined
        const corner =
          space.kind === 'corner'
            ? space.corner
            : space.kind === 'parking'
              ? 'free-parking'
              : undefined
        const isProperty = space.kind === 'property'
        const deed = getPropertyDeed(space)
        const tileClassName = `${edge ? `board-tile board-tile--${edge}` : 'board-tile'}${
          corner ? ` board-tile--corner board-tile--corner-${corner}` : ''
        }`
        const tileContent = corner ? (
          <span
            className={`board-corner-content board-corner-content--${corner}`}
            aria-hidden="true"
          >
            {corner === 'go' && <span className="board-corner-mark">GO</span>}
            {corner === 'jail' && (
              <>
                <span className="board-corner-mark">JAIL</span>
                <span className="board-corner-detail">JUST VISITING</span>
              </>
            )}
            {corner === 'free-parking' && (
              <>
                <span className="board-corner-mark">P</span>
                <span className="board-corner-detail">FREE PARKING</span>
              </>
            )}
            {corner === 'go-to-jail' && (
              <>
                <span className="board-corner-mark">GO TO</span>
                <span className="board-corner-detail">JAIL</span>
              </>
            )}
          </span>
        ) : (
          <>
            {isBottomEdge && (
              <span className="board-tile-bottom-content" aria-hidden="true">
                <span className="board-tile-name board-tile-name--bottom">{space.name}</span>
                {isProperty && <span className="board-tile-band board-tile-band--bottom" />}
              </span>
            )}
            {isLeftEdge && (
              <span className="board-tile-left-content" aria-hidden="true">
                {isProperty && <span className="board-tile-band board-tile-band--left" />}
                <span className="board-tile-name board-tile-name--left">{space.name}</span>
              </span>
            )}
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
          </>
        )

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
            data-corner={corner}
            data-group={isProperty ? space.group : undefined}
            data-selected={deed && selectedDeedId === deed.id ? 'true' : undefined}
            style={{ gridRow: row + 1, gridColumn: column + 1 }}
          >
            {deed ? (
              <button
                type="button"
                className="board-tile-action"
                aria-label={`Show details for ${space.name}`}
                onClick={() => onSelectDeed?.(deed)}
                onFocus={() => onSelectDeed?.(deed)}
                onMouseEnter={() => onSelectDeed?.(deed)}
              >
                {tileContent}
              </button>
            ) : (
              tileContent
            )}
          </div>
        )
      })}
    </div>
  )
}
