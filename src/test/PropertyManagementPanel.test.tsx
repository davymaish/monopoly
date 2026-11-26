import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PropertyManagementPanel from '../components/PropertyManagementPanel'
import { createInitialGameState } from '../game/initial-state'
import type { GameState } from '../game/model'

const setup = {
  playerCount: 2 as const,
  playerNames: ['Alex', 'Jordan'],
  playerColors: ['red', 'blue'] as const,
}

function createState(): GameState {
  return createInitialGameState(setup)
}

describe('PropertyManagementPanel', () => {
  it('lists only properties owned by the current player', () => {
    const initialState = createState()
    const gameState = {
      ...initialState,
      ownership: {
        ...initialState.ownership,
        'mediterranean-avenue': 'player-1',
        'reading-railroad': 'player-2',
      },
    }
    const onAction = vi.fn()

    render(<PropertyManagementPanel gameState={gameState} onAction={onAction} />)

    const properties = screen.getByRole('list', { name: "Alex's owned properties" })
    expect(
      within(properties).getByRole('heading', { name: 'Mediterranean Avenue' }),
    ).toBeInTheDocument()
    expect(
      within(properties).queryByRole('heading', { name: 'Reading Railroad' }),
    ).not.toBeInTheDocument()
    expect(
      within(properties).getByRole('button', { name: 'Mortgage Mediterranean Avenue for $30' }),
    ).toBeInTheDocument()
    expect(
      within(properties).queryByRole('button', { name: 'Build house on Mediterranean Avenue' }),
    ).not.toBeInTheDocument()
  })

  it('offers house-building only after the current player completes a color group', () => {
    const initialState = createState()
    const gameState: GameState = {
      ...initialState,
      ownership: {
        ...initialState.ownership,
        'mediterranean-avenue': 'player-1',
        'baltic-avenue': 'player-1',
      },
    }
    const onAction = vi.fn()

    render(<PropertyManagementPanel gameState={gameState} onAction={onAction} />)

    const property = within(screen.getByRole('list', { name: "Alex's owned properties" }))
    fireEvent.click(property.getByRole('button', { name: 'Build house on Mediterranean Avenue' }))

    expect(onAction).toHaveBeenCalledWith({
      type: 'build-house',
      propertyId: 'mediterranean-avenue',
    })
  })

  it('shows legal hotel and sale actions but blocks mortgages while a group is improved', () => {
    const initialState = createState()
    const gameState: GameState = {
      ...initialState,
      ownership: {
        ...initialState.ownership,
        'oriental-avenue': 'player-1',
        'vermont-avenue': 'player-1',
        'connecticut-avenue': 'player-1',
      },
      propertyBuildings: {
        ...initialState.propertyBuildings,
        'oriental-avenue': { houses: 4, hotels: 0 },
        'vermont-avenue': { houses: 4, hotels: 0 },
        'connecticut-avenue': { houses: 4, hotels: 0 },
      },
    }
    const onAction = vi.fn()

    render(<PropertyManagementPanel gameState={gameState} onAction={onAction} />)

    const property = within(screen.getByRole('list', { name: "Alex's owned properties" }))
    expect(
      property.getByRole('button', { name: 'Build hotel on Vermont Avenue' }),
    ).toBeInTheDocument()
    expect(
      property.getByRole('button', { name: 'Sell building on Vermont Avenue' }),
    ).toBeInTheDocument()
    expect(
      property.queryByRole('button', { name: /Build house on Vermont Avenue/ }),
    ).not.toBeInTheDocument()
    expect(
      property.queryByRole('button', { name: /Mortgage Vermont Avenue/ }),
    ).not.toBeInTheDocument()

    fireEvent.click(property.getByRole('button', { name: 'Build hotel on Vermont Avenue' }))

    expect(onAction).toHaveBeenCalledWith({ type: 'build-hotel', propertyId: 'vermont-avenue' })
  })

  it('offers unmortgage only when the current player can pay the full redemption amount', () => {
    const initialState = createState()
    const gameState: GameState = {
      ...initialState,
      ownership: { ...initialState.ownership, 'electric-company': 'player-1' },
      mortgagedProperties: ['electric-company'],
    }
    const onAction = vi.fn()

    const { queryByRole, rerender } = render(
      <PropertyManagementPanel gameState={gameState} onAction={onAction} />,
    )

    const property = within(screen.getByRole('list', { name: "Alex's owned properties" }))
    fireEvent.click(property.getByRole('button', { name: 'Unmortgage Electric Company for $83' }))
    expect(onAction).toHaveBeenCalledWith({
      type: 'unmortgage-property',
      propertyId: 'electric-company',
    })

    const poorState: GameState = {
      ...gameState,
      players: gameState.players.map((player, index) =>
        index === 0 ? { ...player, cash: 82 } : player,
      ),
    }
    rerender(<PropertyManagementPanel gameState={poorState} onAction={vi.fn()} />)
    expect(
      queryByRole('button', { name: 'Unmortgage Electric Company for $83' }),
    ).not.toBeInTheDocument()
  })

  it('shows only the debtor’s legal sale and mortgage remedies while debt is pending', () => {
    const initialState = createState()
    const gameState: GameState = {
      ...initialState,
      ownership: { ...initialState.ownership, 'reading-railroad': 'player-2' },
      debtResolution: {
        debtorId: 'player-2',
        creditorId: 'player-1',
        amount: 100,
        reason: 'rent',
        resumeJailMovement: false,
      },
      phase: 'awaiting-player-action',
    }
    const onAction = vi.fn()

    render(<PropertyManagementPanel gameState={gameState} onAction={onAction} />)

    const properties = screen.getByRole('list', { name: "Jordan's owned properties" })
    fireEvent.click(
      within(properties).getByRole('button', { name: 'Mortgage Reading Railroad for $100' }),
    )
    expect(onAction).toHaveBeenCalledWith({
      type: 'mortgage-property',
      propertyId: 'reading-railroad',
    })
    expect(within(properties).queryByRole('button', { name: /Unmortgage/ })).not.toBeInTheDocument()
    expect(
      within(properties).queryByRole('button', { name: /Build house/ }),
    ).not.toBeInTheDocument()
  })

  it('hides all management actions outside a permitted player-action phase', () => {
    const initialState = createState()
    const gameState: GameState = {
      ...initialState,
      phase: 'auction',
      ownership: { ...initialState.ownership, 'mediterranean-avenue': 'player-1' },
    }

    render(<PropertyManagementPanel gameState={gameState} onAction={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Mediterranean Avenue' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Mortgage Mediterranean Avenue/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Build house on Mediterranean Avenue/ }),
    ).not.toBeInTheDocument()
  })
})
