import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Auth from '../../pages/auth'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}))

describe('Auth Page', () => {
  it('renders login form by default', () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    )
    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument()
  })

  it('can toggle to sign up mode', () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    )
    const signUpTab = screen.getByRole('tab', { name: /sign up/i })
    fireEvent.click(signUpTab)
    expect(screen.getByText(/Create an Account/i)).toBeInTheDocument()
  })
})
