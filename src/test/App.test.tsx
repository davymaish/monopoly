import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('App shell', () => {
  it('renders accessible page landmarks and the app heading', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Monopoly' })).toBeInTheDocument()
  })
})

describe('App', () => {
  it('renders the placeholder message', () => {
    render(<App />)

    expect(screen.getByText('Game interface is being built.')).toBeInTheDocument()
  })
})
