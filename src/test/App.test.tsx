import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('App shell', () => {
  it('renders accessible page landmarks and the app heading', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Monopoly' })).toBeInTheDocument()
  })

  it('renders the board perimeter', () => {
    render(<App />)

    expect(screen.getByRole('list', { name: 'Monopoly board' })).toBeInTheDocument()
  })

  it('shows a deed card when a property is hovered', () => {
    render(<App />)

    const property = screen.getByRole('button', {
      name: 'Show details for Mediterranean Avenue',
    })
    fireEvent.mouseEnter(property)

    expect(screen.getByRole('complementary', { name: 'Property details' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Mediterranean Avenue' }),
    ).toBeInTheDocument()
    expect(screen.getByText('$60')).toBeInTheDocument()
    expect(property.closest('.board-tile')).toHaveAttribute('data-selected', 'true')
  })
})
