import { fireEvent, render, screen, within } from '@testing-library/react'
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

  it('starts with two players and lets the count be changed', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 2, name: 'Game setup' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '2 players' })).toBeChecked()
    expect(screen.getAllByRole('textbox')).toHaveLength(2)

    fireEvent.click(screen.getByRole('radio', { name: '4 players' }))

    expect(screen.getByRole('radio', { name: '4 players' })).toBeChecked()
    expect(screen.getAllByRole('textbox')).toHaveLength(4)
  })

  it('trims entered names and replaces blank names with their player defaults', () => {
    render(<App />)

    const firstName = screen.getByRole('textbox', { name: 'Player 1 name' })
    fireEvent.change(firstName, { target: { value: '  Alice  ' } })
    fireEvent.blur(firstName)
    expect(firstName).toHaveValue('Alice')

    const secondName = screen.getByRole('textbox', { name: 'Player 2 name' })
    fireEvent.change(secondName, { target: { value: '   ' } })
    fireEvent.blur(secondName)
    expect(secondName).toHaveValue('Player 2')
  })

  it('shows an accessible setup error and preserves a blank name until corrected', () => {
    render(<App />)

    const firstName = screen.getByRole('textbox', { name: 'Player 1 name' })
    fireEvent.change(firstName, { target: { value: '' } })

    expect(firstName).toHaveValue('')
    expect(firstName).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Enter a name for this player.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Resolve the highlighted setup fields')

    fireEvent.change(firstName, { target: { value: 'Avery' } })

    expect(firstName).toHaveValue('Avery')
    expect(screen.getByRole('status')).toHaveTextContent('Setup is valid.')
  })

  it('assigns distinct token colors to active players', () => {
    render(<App />)

    expect(screen.getAllByRole('combobox')).toHaveLength(2)
    fireEvent.click(screen.getByRole('radio', { name: '4 players' }))
    expect(screen.getAllByRole('combobox')).toHaveLength(4)

    const firstPlayerColor = screen.getByRole('combobox', { name: 'Player 1 token color' })
    fireEvent.change(firstPlayerColor, { target: { value: 'orange' } })

    expect(firstPlayerColor).toHaveValue('orange')
    const secondPlayerColor = screen.getByRole('combobox', { name: 'Player 2 token color' })
    expect(within(secondPlayerColor).getByRole('option', { name: 'Orange' })).toBeDisabled()
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
