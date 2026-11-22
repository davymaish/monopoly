import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('App', () => {
  it('renders the placeholder message', () => {
    render(<App />)

    expect(screen.getByText('Game interface is being built.')).toBeInTheDocument()
  })
})
