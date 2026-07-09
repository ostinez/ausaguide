import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Tours from '../../pages/tours'

// Mock the SEO hook since it uses DOM
vi.mock('@/hooks/useSEO', () => ({
  useSEO: vi.fn(),
}))

describe('Tours Page', () => {
  it('renders the header correctly', () => {
    render(
      <BrowserRouter>
        <Tours />
      </BrowserRouter>
    )
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/Explore Tours/i)
  })
})
