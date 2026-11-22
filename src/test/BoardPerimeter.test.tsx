import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BoardPerimeter, { getBoardGridCoordinates } from '../components/BoardPerimeter'

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

  it('renders all board spaces as labelled perimeter slots with a reserved center', () => {
    render(<BoardPerimeter />)

    expect(screen.getByRole('list', { name: 'Monopoly board' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(40)
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
})
