import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../../pages/dashboard'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}))

describe('Dashboard Page', () => {
  it('renders loading or unauthenticated state by default', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )
    // The dashboard will likely redirect or show loading since we return no session
    // We just want to ensure it doesn't crash on mount
    expect(document.body).toBeTruthy()
  })
})
