import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PropertyDetailCard from '../components/PropertyDetailCard'
import { RAILROADS } from '../game/railroad-data'
import { STREET_PROPERTIES } from '../game/street-data'
import { UTILITIES } from '../game/utility-data'

describe('PropertyDetailCard', () => {
  it('shows street price, mortgage, rent schedule, and building costs', () => {
    render(<PropertyDetailCard property={STREET_PROPERTIES[0]} />)

    expect(
      screen.getByRole('heading', { level: 3, name: 'Mediterranean Avenue' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Brown street')).toBeInTheDocument()
    expect(screen.getByText('$60')).toBeInTheDocument()
    const mortgageRow = screen.getByText('Mortgage value').parentElement
    expect(mortgageRow).toHaveTextContent('$30')
    expect(screen.getByText('Base rent')).toBeInTheDocument()
    expect(screen.getByText('Complete-group rent')).toBeInTheDocument()
    expect(screen.getByText('Rent with 4 houses')).toBeInTheDocument()
    expect(screen.getByText('Rent with hotel')).toBeInTheDocument()
    expect(screen.getByText('House cost')).toBeInTheDocument()
  })

  it('shows railroad rents by number owned', () => {
    render(<PropertyDetailCard property={RAILROADS[0]} />)

    expect(screen.getByRole('heading', { level: 3, name: 'Reading Railroad' })).toBeInTheDocument()
    expect(screen.getByText('Rent with 1 railroad')).toBeInTheDocument()
    expect(screen.getByText('Rent with 4 railroads')).toBeInTheDocument()
  })

  it('shows utility rent multipliers from utility data', () => {
    render(<PropertyDetailCard property={UTILITIES[0]} />)

    expect(screen.getByRole('heading', { level: 3, name: 'Electric Company' })).toBeInTheDocument()
    expect(screen.getByText('Rent with one utility')).toBeInTheDocument()
    expect(screen.getByText('4× dice total')).toBeInTheDocument()
    expect(screen.getByText('10× dice total')).toBeInTheDocument()
  })

  it('shows owner identity with the selected player token color', () => {
    render(
      <PropertyDetailCard
        property={STREET_PROPERTIES[0]}
        owner={{ name: 'Alice', color: 'red' }}
      />,
    )

    expect(screen.getByText('Owned by Alice')).toBeInTheDocument()
    expect(document.querySelector('.property-detail-owner-swatch')).toHaveStyle({
      backgroundColor: '#a52832',
    })
  })

  it('prompts players before a deed has been selected', () => {
    render(<PropertyDetailCard property={null} />)

    expect(screen.getByText(/Hover over, focus, or select/)).toBeInTheDocument()
  })
})
