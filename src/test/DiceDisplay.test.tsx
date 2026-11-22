import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import DiceDisplay from '../components/DiceDisplay'

describe('DiceDisplay', () => {
  it('shows a status message before the first roll', () => {
    render(<DiceDisplay dice={null} />)

    expect(screen.getByRole('status')).toHaveTextContent('Roll the dice to see your result.')
  })

  it('shows both die values with accessible labels and the correct total', () => {
    render(<DiceDisplay dice={[2, 5]} />)

    const diceRegion = screen.getByRole('region', { name: 'Dice result' })

    expect(within(diceRegion).getByRole('img', { name: 'First die shows 2' })).toHaveTextContent(
      '2',
    )
    expect(within(diceRegion).getByRole('img', { name: 'Second die shows 5' })).toHaveTextContent(
      '5',
    )
    expect(within(diceRegion).getByText('Total').parentElement).toHaveTextContent('7')
  })
})
