import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('property-management app flow', () => {
  it('updates mortgage status and player cash immediately after mortgage and redemption', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
    randomSpy.mockReturnValueOnce(0.2).mockReturnValueOnce(0.9)
    fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }))
    fireEvent.click(screen.getByRole('button', { name: 'Complete movement' }))
    fireEvent.click(screen.getByRole('button', { name: 'Buy Vermont Avenue for $100' }))

    const properties = screen.getByRole('list', { name: "Player 1's owned properties" })
    fireEvent.click(
      within(properties).getByRole('button', { name: 'Mortgage Vermont Avenue for $50' }),
    )

    expect(within(properties).getByText('Mortgaged — rent is not collected')).toBeInTheDocument()
    expect(screen.getByText('$1,450')).toBeInTheDocument()

    fireEvent.click(
      within(properties).getByRole('button', { name: 'Unmortgage Vermont Avenue for $55' }),
    )

    expect(within(properties).getByText('Not mortgaged')).toBeInTheDocument()
    expect(screen.getByText('$1,395')).toBeInTheDocument()
  })
})
