import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import TreePlanting from '../../pages/TreePlanting'

// Mock the SEO hook since it uses DOM
vi.mock('@/hooks/useSEO', () => ({
  useSEO: vi.fn(),
}))

describe('Tree Planting Page', () => {
  it('renders the tree planting hero correctly', () => {
    render(
      <BrowserRouter>
        <TreePlanting />
      </BrowserRouter>
    )
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/Plant Trees, Grow Hope/i)
  })
})
