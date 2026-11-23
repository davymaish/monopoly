import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from '../App'

describe('App shell', () => {
  it('renders accessible page landmarks and the app heading', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Monopoly' })).toBeInTheDocument()
  })

  it('keeps setup visible until a valid game starts, then renders the board', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 2, name: 'Game setup' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Monopoly board' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Start game' }))

    expect(screen.queryByRole('heading', { level: 2, name: 'Game setup' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Game board' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Players' })).toBeInTheDocument()
    expect(screen.getAllByText('$1,500')).toHaveLength(2)
    expect(screen.getByRole('list', { name: 'Monopoly board' })).toBeInTheDocument()
    const goTile = screen.getByRole('listitem', { name: 'GO, space 1' })
    expect(within(goTile).getByRole('img', { name: 'Player 1 token' })).toBeInTheDocument()
    expect(within(goTile).getByRole('img', { name: 'Player 2 token' })).toBeInTheDocument()
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

  it('disables rolling after the first roll while movement resolution is pending', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }))

    const rollButton = screen.getByRole('button', { name: 'Roll dice' })
    expect(rollButton).toBeEnabled()
    fireEvent.click(rollButton)

    expect(rollButton).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Dice rolled. Movement resolution is pending.',
    )
    const diceRegion = screen.getByRole('region', { name: 'Dice result' })
    expect(within(diceRegion).getAllByRole('img')).toHaveLength(2)
    expect(within(diceRegion).getByText('Total').parentElement).toHaveTextContent(/\d+/)
  })

  it('shows phase-aware movement and end-turn controls with current activity', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.8)

    try {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
      randomSpy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.9)

      const summary = screen.getByRole('region', { name: 'Turn summary' })
      expect(within(summary).getByText('Player 1', { selector: 'strong' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'End turn' })).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }))
      expect(screen.getByRole('button', { name: 'Complete movement' })).toBeEnabled()
      fireEvent.click(screen.getByRole('button', { name: 'Complete movement' }))
      expect(screen.getByRole('button', { name: 'End turn' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDisabled()

      fireEvent.click(screen.getByRole('button', { name: 'End turn' }))

      expect(within(summary).getByText('Player 2', { selector: 'strong' })).toBeInTheDocument()
      const activity = screen.getByRole('list', { name: 'Recent activity' })
      expect(within(activity).getByText(/Player 1 rolled \d and \d\./)).toBeInTheDocument()
      expect(within(activity).getByText(/Player 1 moved \d+ spaces to/)).toBeInTheDocument()
      expect(within(activity).getByText(/Player 2 is up next\./)).toBeInTheDocument()
    } finally {
      randomSpy.mockRestore()
    }
  })

  it('offers an affordable property purchase and records the completed transaction', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)

    try {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
      randomSpy.mockReturnValueOnce(0.2).mockReturnValueOnce(0.9)
      fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }))
      fireEvent.click(screen.getByRole('button', { name: 'Complete movement' }))

      const offer = screen.getByRole('region', { name: 'Property purchase' })
      expect(within(offer).getByText('Vermont Avenue')).toBeInTheDocument()
      expect(within(offer).getByText(/costs \$100/)).toBeInTheDocument()
      expect(within(offer).getByText('Your balance: $1,500.')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'End turn' })).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Buy Vermont Avenue for $100' }))

      expect(screen.queryByRole('region', { name: 'Property purchase' })).not.toBeInTheDocument()
      expect(screen.getByText('$1,400')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'End turn' })).toBeEnabled()
      expect(
        screen.getByRole('listitem', { name: 'Vermont Avenue, space 9, owned by Player 1' }),
      ).toHaveAttribute('data-owner-id', 'player-1')
      fireEvent.click(screen.getByRole('button', { name: 'Show details for Vermont Avenue' }))
      expect(screen.getByText('Owned by Player 1')).toBeInTheDocument()
      const activity = screen.getByRole('list', { name: 'Recent activity' })
      expect(
        within(activity).getByText(/Player 1 paid \$100 to the bank for property purchase/),
      ).toBeInTheDocument()
    } finally {
      randomSpy.mockRestore()
    }
  })

  it('starts an auction when a property is declined and resumes after a winning bid', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)

    try {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
      randomSpy.mockReturnValueOnce(0.2).mockReturnValueOnce(0.9)
      fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }))
      fireEvent.click(screen.getByRole('button', { name: 'Complete movement' }))

      fireEvent.click(screen.getByRole('button', { name: 'Decline purchase' }))

      expect(screen.queryByRole('region', { name: 'Property purchase' })).not.toBeInTheDocument()
      const auction = screen.getByRole('region', { name: 'Property auction' })
      expect(within(auction).getByText('Vermont Avenue')).toBeInTheDocument()
      expect(within(auction).getByText(/Player 2 is bidding/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'End turn' })).not.toBeInTheDocument()

      fireEvent.change(screen.getByRole('spinbutton', { name: 'Bid amount' }), {
        target: { value: '50' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Bid' }))
      expect(within(auction).getByText(/Current bid: \$50 by Player 2/)).toBeInTheDocument()
      expect(within(auction).getByText(/Player 1 is bidding/)).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Pass' }))

      expect(screen.queryByRole('region', { name: 'Property auction' })).not.toBeInTheDocument()
      expect(screen.getByText('$1,450')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'End turn' })).toBeEnabled()
      expect(
        screen.getByRole('listitem', { name: 'Vermont Avenue, space 9, owned by Player 2' }),
      ).toHaveAttribute('data-owner-id', 'player-2')
      expect(
        within(screen.getByRole('list', { name: 'Recent activity' })).queryByText(/paid \$100/),
      ).not.toBeInTheDocument()
    } finally {
      randomSpy.mockRestore()
    }
  })

  it('draws and completes a card from the landed-on deck before ending the turn', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)

    try {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
      fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }))
      fireEvent.click(screen.getByRole('button', { name: 'Complete movement' }))

      expect(screen.queryByRole('button', { name: 'End turn' })).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Draw Community Chest card' }))

      expect(screen.getByText('Bank error in your favor. Collect $200.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
      expect(screen.queryByRole('button', { name: 'End turn' })).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

      expect(screen.getByText('$1,700')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Roll again' })).toBeEnabled()
      const activity = screen.getByRole('list', { name: 'Recent activity' })
      expect(within(activity).getByText(/Player 1 collected \$200 from a card/)).toBeInTheDocument()
      expect(
        within(activity).getByText(/drew from Community Chest: Bank error/),
      ).toBeInTheDocument()
      expect(
        within(activity).getByText(/returned the card to the bottom of the Community Chest deck/),
      ).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Roll again' }))
      randomSpy.mockReturnValueOnce(0.2).mockReturnValueOnce(0.9)
      fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }))
      fireEvent.click(screen.getByRole('button', { name: 'Complete movement' }))
      expect(screen.getByRole('button', { name: 'End turn' })).toBeEnabled()
    } finally {
      randomSpy.mockRestore()
    }
  })

  it('offers income-tax choices and requires payment before ending the turn', () => {
    const samples = [...Array.from({ length: 30 }, () => 0.5), 0, 0.34]
    let sampleIndex = 0
    const randomSpy = vi
      .spyOn(Math, 'random')
      .mockImplementation(() => samples[sampleIndex++] ?? 0.5)

    try {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
      fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }))
      fireEvent.click(screen.getByRole('button', { name: 'Complete movement' }))

      const taxPrompt = screen.getByRole('region', { name: 'Income Tax' })
      expect(within(taxPrompt).getByText(/may pay \$200 or 10% of total worth/)).toBeInTheDocument()
      expect(within(taxPrompt).getByText(/Total worth: \$1,500/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'End turn' })).not.toBeInTheDocument()
      expect(screen.getByText('Pay the tax before ending your turn.')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /Pay \$150 \(10% of total worth\)/ }))

      expect(screen.queryByRole('region', { name: 'Income Tax' })).not.toBeInTheDocument()
      expect(screen.getByText('$1,350')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'End turn' })).toBeEnabled()
      expect(
        within(screen.getByRole('list', { name: 'Recent activity' })).getByText(
          /Player 1 paid \$150 to the bank for tax/,
        ),
      ).toBeInTheDocument()
    } finally {
      randomSpy.mockRestore()
    }
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
    expect(screen.getByRole('button', { name: 'Start game' })).toBeDisabled()

    fireEvent.change(firstName, { target: { value: 'Avery' } })

    expect(firstName).toHaveValue('Avery')
    expect(screen.getByRole('status')).toHaveTextContent('Setup is valid.')
    expect(screen.getByRole('button', { name: 'Start game' })).toBeEnabled()
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
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }))

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
