import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BoardPerimeter, { getBoardGridCoordinates } from '../components/BoardPerimeter'
import { BOARD_SPACES } from '../game/board'

describe('board perimeter', () => {
  it('maps all 40 board positions to unique perimeter cells', () => {
    const coordinates = Array.from({ length: 40 }, (_, position) =>
      getBoardGridCoordinates(position),
    )
    const uniqueCells = new Set(coordinates.map(({ row, column }) => `${row},${column}`))

    expect(uniqueCells.size).toBe(40)
    expect(
      coordinates.every(
        ({ row, column }) => row === 0 || row === 10 || column === 0 || column === 10,
      ),
    ).toBe(true)
  })

  it('places the four corners at the corners of the 11 by 11 perimeter', () => {
    expect(getBoardGridCoordinates(0)).toEqual({ row: 10, column: 10 })
    expect(getBoardGridCoordinates(10)).toEqual({ row: 10, column: 0 })
    expect(getBoardGridCoordinates(20)).toEqual({ row: 0, column: 0 })
    expect(getBoardGridCoordinates(30)).toEqual({ row: 0, column: 10 })
  })

  it('renders four distinct upright corner treatments with accessible board names', () => {
    const { container } = render(<BoardPerimeter />)
    const cornerTiles = Array.from(
      container.querySelectorAll<HTMLElement>('.board-tile[data-corner]'),
    )
    const expectedCorners = [
      { position: 0, kind: 'go', name: 'GO', mark: 'GO' },
      { position: 10, kind: 'jail', name: 'Jail / Just Visiting', mark: 'JAIL' },
      { position: 20, kind: 'free-parking', name: 'Free Parking', mark: 'P' },
      { position: 30, kind: 'go-to-jail', name: 'Go to Jail', mark: 'GO TO' },
    ]

    expect(cornerTiles).toHaveLength(4)
    expect(cornerTiles.map((tile) => Number(tile.dataset.position))).toEqual(
      expectedCorners.map((corner) => corner.position),
    )

    expectedCorners.forEach(({ position, kind, name, mark }) => {
      const tile = cornerTiles.find(
        (cornerTile) => Number(cornerTile.dataset.position) === position,
      )

      expect(tile).toHaveAttribute('data-corner', kind)
      expect(tile).toHaveClass('board-tile--corner', `board-tile--corner-${kind}`)
      expect(tile).toHaveAttribute('aria-label', `${name}, space ${position + 1}`)
      expect(tile?.querySelector('.board-corner-mark')).toHaveTextContent(mark)
      expect(tile?.querySelector('.board-tile-name')).not.toBeInTheDocument()
      expect(screen.getByRole('listitem', { name: `${name}, space ${position + 1}` })).toBe(tile)
    })
  })

  it('renders the top ten spaces in order with labels and property group colors', () => {
    const { container } = render(<BoardPerimeter />)
    const topTiles = Array.from(
      container.querySelectorAll<HTMLElement>('.board-tile[data-edge="top"]'),
    )
    const expectedSpaces = BOARD_SPACES.filter(
      (space) => space.position >= 20 && space.position < 30,
    )

    expect(topTiles).toHaveLength(10)
    expect(topTiles.map((tile) => Number(tile.dataset.position))).toEqual(
      expectedSpaces.map((space) => space.position),
    )

    expectedSpaces.forEach((space, index) => {
      const tile = topTiles[index]

      expect(tile).toHaveAttribute('data-grid-row', '0')
      expect(tile).toHaveAttribute('data-grid-column', String(index))

      if (space.position === 20) {
        expect(tile.querySelector('.board-corner-content')).toHaveClass(
          'board-corner-content--free-parking',
        )
      } else {
        expect(tile.querySelector('.board-tile-name')).toHaveTextContent(space.name)
      }

      if (space.kind === 'property') {
        expect(tile).toHaveAttribute('data-group', space.group)
        expect(tile.querySelector('.board-tile-band')).toBeInTheDocument()
      } else {
        expect(tile).not.toHaveAttribute('data-group')
        expect(tile.querySelector('.board-tile-band')).not.toBeInTheDocument()
      }
    })
  })

  it('renders the right ten spaces from top to bottom with vertical labels', () => {
    const { container } = render(<BoardPerimeter />)
    const rightTiles = Array.from(
      container.querySelectorAll<HTMLElement>('.board-tile[data-edge="right"]'),
    )
    const expectedSpaces = BOARD_SPACES.filter(
      (space) => space.position >= 30 && space.position < 40,
    )

    expect(rightTiles).toHaveLength(10)
    expect(rightTiles.map((tile) => Number(tile.dataset.position))).toEqual(
      expectedSpaces.map((space) => space.position),
    )

    expectedSpaces.forEach((space, index) => {
      const tile = rightTiles[index]
      const name = tile.querySelector('.board-tile-name')

      expect(tile).toHaveAttribute('data-grid-row', String(index))
      expect(tile).toHaveAttribute('data-grid-column', '10')

      if (space.position === 30) {
        expect(tile.querySelector('.board-corner-content')).toHaveClass(
          'board-corner-content--go-to-jail',
        )
      } else {
        expect(name).toHaveTextContent(space.name)
        expect(name).toHaveClass('board-tile-name--right')
      }

      if (space.kind === 'property') {
        expect(tile).toHaveAttribute('data-group', space.group)
        expect(tile.querySelector('.board-tile-band')).toHaveClass('board-tile-band--right')
      } else {
        expect(tile).not.toHaveAttribute('data-group')
        expect(tile.querySelector('.board-tile-band')).not.toBeInTheDocument()
      }
    })
  })

  it('renders the bottom ten spaces in movement order across reversed columns', () => {
    const { container } = render(<BoardPerimeter />)
    const bottomTiles = Array.from(
      container.querySelectorAll<HTMLElement>('.board-tile[data-edge="bottom"]'),
    )
    const expectedSpaces = BOARD_SPACES.filter(
      (space) => space.position >= 0 && space.position < 10,
    )

    expect(bottomTiles).toHaveLength(10)
    expect(bottomTiles.map((tile) => Number(tile.dataset.position))).toEqual(
      expectedSpaces.map((space) => space.position),
    )

    expectedSpaces.forEach((space, index) => {
      const tile = bottomTiles[index]
      const name = tile.querySelector('.board-tile-name')

      expect(tile).toHaveAttribute('data-grid-row', '10')
      expect(tile).toHaveAttribute('data-grid-column', String(10 - index))

      if (space.position === 0) {
        expect(tile.querySelector('.board-corner-content')).toHaveClass('board-corner-content--go')
      } else {
        expect(name).toHaveTextContent(space.name)
        expect(name).toHaveClass('board-tile-name--bottom')
      }

      if (space.kind === 'property') {
        expect(tile).toHaveAttribute('data-group', space.group)
        expect(tile.querySelector('.board-tile-band')).toHaveClass('board-tile-band--bottom')
      } else {
        expect(tile).not.toHaveAttribute('data-group')
        expect(tile.querySelector('.board-tile-band')).not.toBeInTheDocument()
      }
    })
  })

  it('renders the left ten spaces from bottom to top with vertical labels', () => {
    const { container } = render(<BoardPerimeter />)
    const leftTiles = Array.from(
      container.querySelectorAll<HTMLElement>('.board-tile[data-edge="left"]'),
    )
    const expectedSpaces = BOARD_SPACES.filter(
      (space) => space.position >= 10 && space.position < 20,
    )

    expect(leftTiles).toHaveLength(10)
    expect(leftTiles.map((tile) => Number(tile.dataset.position))).toEqual(
      expectedSpaces.map((space) => space.position),
    )

    expectedSpaces.forEach((space, index) => {
      const tile = leftTiles[index]
      const name = tile.querySelector('.board-tile-name')

      expect(tile).toHaveAttribute('data-grid-row', String(10 - index))
      expect(tile).toHaveAttribute('data-grid-column', '0')

      if (space.position === 10) {
        expect(tile.querySelector('.board-corner-content')).toHaveClass(
          'board-corner-content--jail',
        )
      } else {
        expect(name).toHaveTextContent(space.name)
        expect(name).toHaveClass('board-tile-name--left')
      }

      if (space.kind === 'property') {
        expect(tile).toHaveAttribute('data-group', space.group)
        expect(tile.querySelector('.board-tile-band')).toHaveClass('board-tile-band--left')
      } else {
        expect(tile).not.toHaveAttribute('data-group')
        expect(tile.querySelector('.board-tile-band')).not.toBeInTheDocument()
      }
    })
  })

  it('renders all board spaces as labelled perimeter slots with a reserved center', () => {
    render(<BoardPerimeter />)

    expect(screen.getByRole('list', { name: 'Monopoly board' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(40)
    expect(document.querySelectorAll('.board-tile-name, .board-corner-content')).toHaveLength(40)
    expect(screen.getByRole('listitem', { name: 'GO, space 1' })).toHaveAttribute(
      'data-grid-row',
      '10',
    )
    expect(screen.getByRole('listitem', { name: 'Boardwalk, space 40' })).toHaveAttribute(
      'data-grid-column',
      '10',
    )
    expect(document.querySelector('.board-center')).toBeInTheDocument()
  })

  it('renders named player tokens at their positions and clusters players on the same space', () => {
    render(
      <BoardPerimeter
        players={[
          { id: 'player-1', name: 'Alice', color: 'red', position: 0 },
          { id: 'player-2', name: 'Blake', color: 'blue', position: 0 },
          { id: 'player-3', name: 'Casey', color: 'green', position: 5 },
        ]}
      />,
    )

    const goTile = screen.getByRole('listitem', { name: 'GO, space 1' })
    const railroadTile = screen.getByRole('listitem', { name: 'Reading Railroad, space 6' })

    expect(within(goTile).getAllByRole('img')).toHaveLength(2)
    expect(within(goTile).getByRole('img', { name: 'Alice token' })).toHaveAttribute(
      'data-player-id',
      'player-1',
    )
    expect(within(goTile).getByRole('img', { name: 'Blake token' })).toBeInTheDocument()
    expect(within(railroadTile).getByRole('img', { name: 'Casey token' })).toBeInTheDocument()
    expect(within(railroadTile).getAllByRole('img')).toHaveLength(1)
  })
})
