import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import MentalHealth from '../../pages/MentalHealth'

// Mock the SEO hook since it uses DOM
vi.mock('@/hooks/useSEO', () => ({
  useSEO: vi.fn(),
}))

describe('Mental Health Page', () => {
  it('renders the mental health section correctly', () => {
    render(
      <BrowserRouter>
        <MentalHealth />
      </BrowserRouter>
    )
    expect(screen.getByText(/We understand/i)).toBeInTheDocument()
  })
})
